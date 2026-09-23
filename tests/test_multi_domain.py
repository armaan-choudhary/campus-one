"""Tests for Multi-Intent Detection and Cross-Domain Orchestration Engine.
Verifies semantic intent segmentation, multi-domain dispatch, dependency resolution,
confidence-aware partial failure handling, multi-turn state tracking, and PGVector collection isolation.
"""
import pytest
from unittest.mock import MagicMock, patch
from langchain_core.documents import Document

from backend.graph_state import AssistantState
from backend.graph import run_workflow
from backend.graph_nodes import router_node, route_by_confidence, orchestrate_node
from backend.routing.hybrid_router import route_query
from backend.routing.multi_intent import MultiIntentDetector
from backend.routing.schemas import RoutingResult
from backend.rag.schemas import DomainRAGResult
from backend.orchestration.schemas import DomainResolution, DependencyRelation, OrchestrationResult
from backend.orchestration.dependency_graph import DependencyGraphEngine, VERIFIED_SYSTEM_WORKFLOWS
from backend.orchestration.engine import OrchestrationEngine, execute_orchestrated_turn


class TestSingleDomainNoFalseMulti:
    """Verifies that single-domain requests do NOT trigger false multi-intent detection."""

    @pytest.mark.parametrize(
        "query,expected_dept",
        [
            ("How do I reset my student email and Wi-Fi password?", "it"),
            ("What is the deadline for paying the spring semester tuition fees?", "fees"),
            ("How do I submit an application for faculty casual leave in the HR portal?", "hr"),
            ("The air conditioner in seminar hall B is leaking water and making noise.", "facilities"),
        ],
    )
    def test_single_domain_query_routing(self, query: str, expected_dept: str):
        result: RoutingResult = route_query(query)
        assert result.route_mode == "single", f"Expected single route mode for '{query}', got {result.route_mode}"
        assert result.department == expected_dept
        assert expected_dept in result.target_domains


class TestMultiIntentDetection:
    """Verifies that compound queries spanning multiple domains are identified as multi-intent."""

    @pytest.mark.parametrize(
        "query,expected_domains",
        [
            (
                "My fee payment failed and now I can't access the student portal.",
                {"fees", "it"},
            ),
            (
                "I need to pay my hostel caution deposit and check into my dormitory room.",
                {"fees", "facilities"},
            ),
            (
                "My teaching assistant stipend hasn't been credited and I need to pay my tuition balance.",
                {"hr", "fees"},
            ),
            (
                "The air conditioning in the computer lab is broken and the printer has run out of toner.",
                {"facilities", "it"},
            ),
        ],
    )
    def test_multi_intent_detection(self, query: str, expected_domains: set):
        result: RoutingResult = route_query(query)
        assert result.route_mode == "multi", f"Query '{query}' should be detected as multi-intent (got {result.route_mode})"
        assert set(result.target_domains) == expected_domains
        assert len(result.intent_clauses) >= 2


class TestDependencyGraphEngine:
    """Verifies prerequisite detection, evidence extraction, and topological sorting."""

    def setup_method(self):
        self.dep_engine = DependencyGraphEngine()

    def test_fees_to_it_dependency_inference(self):
        query = "My fee payment failed and I cannot log into the student portal for exam registration."
        deps = self.dep_engine.infer_dependencies(
            domains=["fees", "it"],
            query=query,
            retrieved_contexts={
                "fees": "Tuition clearance is required before course registration hold is removed.",
                "it": "Student portal login displays academic hold when fee dues are pending.",
            },
        )
        assert len(deps) >= 1
        dep = deps[0]
        assert dep.source_domain == "fees"
        assert dep.target_domain == "it"
        assert dep.relation_type == "prerequisite_for"
        assert dep.evidence_source is not None
        assert any(term in dep.evidence_source.lower() for term in ["requirement", "required before", "hold", "clearance"])

    def test_fees_to_facilities_dependency_inference(self):
        query = "I have paid my hostel fee receipt and need my dormitory room keys."
        deps = self.dep_engine.infer_dependencies(
            domains=["fees", "facilities"],
            query=query,
        )
        assert len(deps) >= 1
        assert deps[0].source_domain == "fees"
        assert deps[0].target_domain == "facilities"

    def test_topological_sorting_resolves_prerequisites_first(self):
        deps = [
            DependencyRelation(
                source_domain="fees",
                source_issue="Tuition payment",
                target_domain="it",
                target_issue="Portal unlock",
                relation_type="prerequisite_for",
                explanation="Fees must be paid first.",
            )
        ]
        ordered = self.dep_engine.sort_execution_order(domains=["it", "fees"], dependencies=deps)
        assert ordered == ["fees", "it"], "Prerequisite 'fees' must precede dependent 'it'"


class TestCrossDomainOrchestrationEngine:
    """Verifies parallel independent domain execution, synthesis, and next steps generation."""

    @patch("backend.orchestration.engine.execute_domain_rag")
    def test_multi_domain_synthesis(self, mock_rag):
        def side_effect(query, department, conversation_context=None):
            if department == "fees":
                return DomainRAGResult(
                    answer="Tuition payment can be completed online via the finance portal by Oct 15.",
                    department="fees",
                    answer_confidence=0.92,
                    sources=["finance_handbook.pdf, page 2"],
                    citations=[{"source": "finance_handbook.pdf", "page": 2, "excerpt": "Oct 15 deadline"}],
                    solved=True,
                    human_required=False,
                    handoff_reason=None,
                    retrieved_documents=[Document(page_content="Tuition payment clearance required for portal.")],
                )
            elif department == "it":
                return DomainRAGResult(
                    answer="Student portal accounts can be unlocked with multi-factor authentication reset.",
                    department="it",
                    answer_confidence=0.88,
                    sources=["it_account_guide.pdf, page 5"],
                    citations=[{"source": "it_account_guide.pdf", "page": 5, "excerpt": "MFA reset"}],
                    solved=True,
                    human_required=False,
                    handoff_reason=None,
                    retrieved_documents=[Document(page_content="Student portal login requires active credentials.")],
                )
            raise ValueError(f"Unexpected department {department}")

        mock_rag.side_effect = side_effect

        routing = RoutingResult(
            department="fees",
            confidence=0.85,
            department_scores={"fees": 0.85, "it": 0.82, "facilities": 0.1, "hr": 0.05},
            requires_clarification=False,
            route_mode="multi",
            target_domains=["fees", "it"],
            intent_clauses=[
                {"domain": "fees", "clause": "My fee payment failed"},
                {"domain": "it", "clause": "now I can't access the student portal"},
            ],
        )

        orch_res = execute_orchestrated_turn(
            query="My fee payment failed and now I can't access the student portal.",
            routing_result=routing,
        )

        # 1. Resolutions check
        assert len(orch_res.resolutions) == 2
        assert orch_res.resolutions["fees"].solved is True
        assert orch_res.resolutions["it"].solved is True
        assert orch_res.partial_failure is False
        assert orch_res.human_required is False

        # 2. Provenance and Citations
        assert "finance_handbook.pdf, page 2" in orch_res.all_sources
        assert "it_account_guide.pdf, page 5" in orch_res.all_sources

        # 3. Structure check in synthesized answer
        answer = orch_res.unified_answer
        assert "Issue 1" in answer
        assert "Issue 2" in answer
        assert "Fees" in answer
        assert "IT" in answer
        assert "Recommended Next Steps" in answer


class TestConfidenceAwarePartialFailure:
    """Verifies that if one domain succeeds while another fails, the system provides a partial grounded resolution with explicit escalation."""

    @patch("backend.orchestration.engine.execute_domain_rag")
    def test_partial_failure_handling(self, mock_rag):
        def side_effect(query, department, conversation_context=None):
            if department == "fees":
                return DomainRAGResult(
                    answer="Fee receipt generation is automatic upon bank transfer confirmation.",
                    department="fees",
                    answer_confidence=0.91,
                    sources=["fees_faq.pdf, page 1"],
                    citations=[],
                    solved=True,
                    human_required=False,
                    handoff_reason=None,
                )
            elif department == "it":
                return DomainRAGResult(
                    answer="Unable to locate troubleshooting guide for specialized LDAP error code 4096.",
                    department="it",
                    answer_confidence=0.32,
                    sources=[],
                    citations=[],
                    solved=False,
                    human_required=True,
                    handoff_reason="Specialized LDAP directory failure requires system administrator intervention",
                )
            raise ValueError(f"Unexpected department {department}")

        mock_rag.side_effect = side_effect

        routing = RoutingResult(
            department="fees",
            confidence=0.75,
            department_scores={"fees": 0.8, "it": 0.7},
            requires_clarification=False,
            route_mode="multi",
            target_domains=["fees", "it"],
            intent_clauses=[
                {"domain": "fees", "clause": "My fee receipt is missing"},
                {"domain": "it", "clause": "LDAP error 4096 on portal"},
            ],
        )

        orch_res = execute_orchestrated_turn(
            query="My fee receipt is missing and I get LDAP error 4096 on the portal.",
            routing_result=routing,
        )

        assert orch_res.partial_failure is True
        assert orch_res.human_required is True

        # Fees is grounded and solved
        assert orch_res.resolutions["fees"].solved is True
        assert any("fees_faq.pdf" in s for s in orch_res.all_sources)

        # IT requires human handoff
        assert orch_res.resolutions["it"].solved is False
        assert orch_res.resolutions["it"].human_required is True

        # Unified response should present the grounded answer AND an explicit escalation warning
        assert "Fee receipt generation is automatic" in orch_res.unified_answer
        assert "Human Assistance Required for IT" in orch_res.unified_answer
        assert "Specialized LDAP directory failure" in orch_res.unified_answer


class TestContextAwareMultiTurnOrchestration:
    """Verifies state tracking across multiple turns (active_domains, topic_history, intent tracking)."""

    @patch("backend.orchestration.engine.execute_domain_rag")
    @patch("backend.graph_nodes.execute_domain_rag")
    def test_multi_turn_state_accumulation(self, mock_graph_rag, mock_orch_rag):
        mock_graph_rag.return_value = DomainRAGResult(
            answer="General response.",
            department="fees",
            answer_confidence=0.88,
            sources=["doc.pdf"],
            citations=[],
            solved=True,
            human_required=False,
            handoff_reason=None,
        )

        # Turn 1: Fees intent
        state1: AssistantState = {
            "current_query": "My scholarship has not been credited and tuition fee is due.",
            "messages": [],
        }
        res1 = run_workflow(state1, thread_id="multi_turn_orch_test")
        assert "fees" in res1["active_domains"]
        assert len(res1["topic_history"]) == 1

        # Turn 2: IT intent
        mock_graph_rag.return_value = DomainRAGResult(
            answer="IT password reset information.",
            department="it",
            answer_confidence=0.90,
            sources=["it_doc.pdf"],
            citations=[],
            solved=True,
            human_required=False,
            handoff_reason=None,
        )
        state2 = dict(res1)
        state2["current_query"] = "I also cannot log in to the student portal."
        res2 = run_workflow(state2, thread_id="multi_turn_orch_test")
        assert "fees" in res2["active_domains"]
        assert "it" in res2["active_domains"]
        assert len(res2["topic_history"]) == 2

        # Turn 3: Multi-intent query
        mock_orch_rag.side_effect = lambda query, department, conversation_context=None: DomainRAGResult(
            answer=f"Answer for {department}",
            department=department,
            answer_confidence=0.9,
            sources=[f"{department}_policy.pdf"],
            citations=[],
            solved=True,
            human_required=False,
            handoff_reason=None,
        )
        state3 = dict(res2)
        state3["current_query"] = "My fee payment failed and now I can't access the student portal."
        res3 = run_workflow(state3, thread_id="multi_turn_orch_test")
        assert res3["route_mode"] == "multi"
        assert set(res3["target_domains"]) == {"fees", "it"}
        assert len(res3["resolved_intents"]) >= 2
        assert res3["solved"] is True


class TestSecurityIsolationInMultiDomain:
    """Verifies that multi-domain queries independently query isolated department collections."""

    @patch("backend.orchestration.engine.execute_domain_rag")
    def test_department_collection_isolation(self, mock_rag):
        mock_rag.return_value = DomainRAGResult(
            answer="Safe isolated answer",
            department="it",
            answer_confidence=0.85,
            sources=[],
            citations=[],
            solved=True,
            human_required=False,
            handoff_reason=None,
        )

        routing = RoutingResult(
            department="fees",
            confidence=0.8,
            department_scores={"fees": 0.8, "it": 0.75},
            requires_clarification=False,
            route_mode="multi",
            target_domains=["fees", "it"],
            intent_clauses=[
                {"domain": "fees", "clause": "Fee invoice error"},
                {"domain": "it", "clause": "Portal reset"},
            ],
        )

        execute_orchestrated_turn(
            query="Fee invoice error and portal reset",
            routing_result=routing,
        )

        # Assert execute_domain_rag was called separately for each domain
        called_depts = [call.kwargs.get("department") for call in mock_rag.call_args_list]
        assert "fees" in called_depts
        assert "it" in called_depts
        assert len(called_depts) == 2
        # Never called with merged or unspecified collection
        assert "all" not in called_depts
        assert "general" not in called_depts
