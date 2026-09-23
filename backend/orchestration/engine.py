"""CampusOne Cross-Domain Orchestration Engine.
Coordinates multi-domain RAG execution, resolves dependencies, and synthesizes unified resolutions.
"""
from typing import Dict, Any, List, Optional
from backend.rag.config import DOMAIN_CONFIG, normalize_department
from backend.rag.schemas import DomainRAGResult
from backend.rag.engine import execute_domain_rag
from backend.routing.schemas import RoutingResult
from backend.orchestration.schemas import (
    DomainResolution,
    OrchestrationResult,
)
from backend.orchestration.dependency_graph import DependencyGraphEngine


class OrchestrationEngine:
    """Orchestrates multi-domain query execution, dependency resolution, and response synthesis."""

    def __init__(self, dependency_engine: Optional[DependencyGraphEngine] = None):
        self.dependency_engine = dependency_engine or DependencyGraphEngine()

    def execute_orchestrated_turn(
        self,
        query: str,
        routing_result: RoutingResult,
        conversation_context: Optional[str] = None,
    ) -> OrchestrationResult:
        """
        Executes parallel domain RAG, verifies individual domain groundings,
        infers resolution dependencies, and synthesizes a structured unified response.
        """
        target_domains = routing_result.target_domains or [routing_result.department]
        # Clean and deduplicate target domains
        cleaned_domains: List[str] = []
        for d in target_domains:
            try:
                norm = normalize_department(d)
                if norm not in cleaned_domains and norm != "clarify":
                    cleaned_domains.append(norm)
            except ValueError:
                continue

        if not cleaned_domains:
            cleaned_domains = ["it"]

        # Map domain to its specific sub-clause if available
        clause_map: Dict[str, str] = {}
        for clause_info in getattr(routing_result, "intent_clauses", []):
            d = clause_info.get("domain")
            c = clause_info.get("clause")
            if d and c:
                clause_map[d] = c

        # 1. Independent Domain RAG Execution
        resolutions: Dict[str, DomainResolution] = {}
        retrieved_contexts: Dict[str, str] = {}
        all_sources: List[str] = []
        all_citations: List[Dict[str, Any]] = []

        for dept in cleaned_domains:
            # Use domain-specific clause if available, otherwise full query
            sub_query = clause_map.get(dept, query)
            display_name = DOMAIN_CONFIG[dept]["display_name"]

            rag_res: DomainRAGResult = execute_domain_rag(
                query=sub_query,
                department=dept,
                conversation_context=conversation_context,
            )

            # Record retrieved text for dependency inference
            if rag_res.retrieved_documents:
                retrieved_contexts[dept] = " ".join(
                    d.page_content for d in rag_res.retrieved_documents
                )

            res = DomainResolution(
                domain=dept,
                display_name=display_name,
                query_clause=sub_query,
                answer=rag_res.answer,
                confidence=rag_res.answer_confidence,
                solved=rag_res.solved,
                human_required=rag_res.human_required,
                handoff_reason=rag_res.handoff_reason,
                sources=rag_res.sources,
                citations=rag_res.citations,
            )
            resolutions[dept] = res
            all_sources.extend(rag_res.sources)
            all_citations.extend(rag_res.citations)

        # 2. Check Partial Failure & Confidence Awareness
        solved_count = sum(1 for r in resolutions.values() if r.solved)
        partial_failure = (solved_count > 0 and solved_count < len(resolutions))
        human_required = any(r.human_required for r in resolutions.values())

        # Average confidence across active domains
        overall_confidence = (
            sum(r.confidence for r in resolutions.values()) / len(resolutions)
            if resolutions
            else 0.0
        )

        # 3. Infer Resolution Dependencies
        dependencies = self.dependency_engine.infer_dependencies(
            domains=cleaned_domains,
            query=query,
            retrieved_contexts=retrieved_contexts,
        )

        # 4. Topological Execution Order
        ordered_domains = self.dependency_engine.sort_execution_order(
            domains=cleaned_domains,
            dependencies=dependencies,
        )

        # 5. Synthesize Structured Output
        sections: List[str] = []
        next_steps: List[str] = []

        # Section per domain issue
        for idx, dept in enumerate(ordered_domains, start=1):
            res = resolutions[dept]
            source_tag = ", ".join(res.sources) if res.sources else "Documentation"

            if res.solved:
                sections.append(
                    f"### Issue {idx} — {res.display_name}\n"
                    f"{res.answer}\n\n"
                    f"*(Domain: {res.display_name} • Grounding Confidence: {res.confidence:.0%} • Source: {source_tag})*"
                )
                next_steps.append(
                    f"Review {res.display_name} instructions regarding '{res.query_clause[:45]}...'."
                )
            else:
                reason = res.handoff_reason or "Insufficient documentation available"
                sections.append(
                    f"### Issue {idx} — {res.display_name}\n"
                    f"{res.answer}\n\n"
                    f"> ⚠️ **[Human Assistance Required for {res.display_name}]:** {reason}"
                )
                next_steps.append(
                    f"Escalate {res.display_name} issue to departmental human support: {reason}."
                )

        # What this means (Dependencies)
        if dependencies:
            dep_lines = []
            for dep in dependencies:
                dep_lines.append(
                    f"- **{dep.source_issue} ➔ {dep.target_issue}:** {dep.explanation}"
                )
                if dep.evidence_source:
                    dep_lines.append(f"  *(Evidence: {dep.evidence_source})*")
            sections.append(
                "### What This Means (System Dependencies)\n" + "\n".join(dep_lines)
            )

        # Logical next steps
        step_lines = [f"{i}. {step}" for i, step in enumerate(next_steps, start=1)]
        sections.append("### Recommended Next Steps\n" + "\n".join(step_lines))

        unified_answer = "\n\n".join(sections)

        return OrchestrationResult(
            query=query,
            route_mode=routing_result.route_mode,
            primary_domain=ordered_domains[0] if ordered_domains else "it",
            target_domains=ordered_domains,
            resolutions=resolutions,
            dependencies=dependencies,
            unified_answer=unified_answer,
            overall_confidence=overall_confidence,
            partial_failure=partial_failure,
            human_required=human_required,
            all_sources=list(dict.fromkeys(all_sources)),
            all_citations=all_citations,
            next_steps=next_steps,
        )


_global_orchestrator: Optional[OrchestrationEngine] = None


def get_orchestration_engine() -> OrchestrationEngine:
    """Returns singleton OrchestrationEngine."""
    global _global_orchestrator
    if _global_orchestrator is None:
        _global_orchestrator = OrchestrationEngine()
    return _global_orchestrator


def execute_orchestrated_turn(
    query: str,
    routing_result: RoutingResult,
    conversation_context: Optional[str] = None,
) -> OrchestrationResult:
    """Primary execution entry point for multi-domain orchestration."""
    return get_orchestration_engine().execute_orchestrated_turn(
        query=query,
        routing_result=routing_result,
        conversation_context=conversation_context,
    )
