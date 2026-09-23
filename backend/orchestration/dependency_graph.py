"""CampusOne Resolution Dependency Graph.
Models and infers resolution workflows across university systems based on verified domain workflows
and retrieved evidence.
"""
from typing import Dict, Any, List, Optional, Set
from backend.orchestration.schemas import DependencyRelation

# Canonical verified university system workflows
VERIFIED_SYSTEM_WORKFLOWS = [
    {
        "source_domain": "fees",
        "source_issue": "Fee Payment & Financial Clearance",
        "target_domain": "it",
        "target_issue": "Student Portal Access & Exam Registration",
        "relation_type": "prerequisite_for",
        "explanation": "Tuition or hostel fee clearance is required before financial holds on student portal accounts can be lifted for course/exam registration.",
        "trigger_terms_source": {"fee", "fees", "tuition", "payment", "scholarship", "dues", "balance", "hold"},
        "trigger_terms_target": {"portal", "login", "blocked", "locked", "registration", "exam", "access", "credentials"},
    },
    {
        "source_domain": "fees",
        "source_issue": "Hostel Fee Payment Receipt",
        "target_domain": "facilities",
        "target_issue": "Hostel Room Allocation & Check-in",
        "relation_type": "prerequisite_for",
        "explanation": "Official hostel fee payment receipt must be verified before the Hostel Warden Office distributes room keys.",
        "trigger_terms_source": {"hostel fee", "caution deposit", "fee receipt", "payment"},
        "trigger_terms_target": {"room", "hostel", "check-in", "allocation", "keys", "dorm"},
    },
    {
        "source_domain": "hr",
        "source_issue": "Scholarship / Stipend / Concession Verification",
        "target_domain": "fees",
        "target_issue": "Semester Fee Invoice Adjustment",
        "relation_type": "prerequisite_for",
        "explanation": "HR or Academic Dean approval for staff/TA fee concession or stipend disbursement must be recorded before fee invoices are recalculated.",
        "trigger_terms_source": {"concession", "stipend", "ta", "ra", "scholarship", "employment", "staff"},
        "trigger_terms_target": {"fee", "tuition", "invoice", "balance", "due"},
    },
    {
        "source_domain": "it",
        "source_issue": "Digital Campus Identity & Access Card",
        "target_domain": "facilities",
        "target_issue": "Physical Lab & Hostel Access",
        "relation_type": "prerequisite_for",
        "explanation": "Active campus network credentials and RFID identity provisioning are required for automated facility turnstiles and computer labs.",
        "trigger_terms_source": {"id card", "identity", "rfid", "credentials", "account", "login"},
        "trigger_terms_target": {"lab access", "turnstile", "hostel gate", "entry", "gym"},
    },
    {
        "source_domain": "hr",
        "source_issue": "Employee Onboarding & Appointment Confirmation",
        "target_domain": "it",
        "target_issue": "Staff Digital Identity & System Credentials",
        "relation_type": "prerequisite_for",
        "explanation": "Official HR onboarding approval or appointment verification is required before campus IT provisions institutional email, ERP access, and active directory accounts.",
        "trigger_terms_source": {"onboarding", "appointment", "hiring", "offer", "contract", "employee", "staff"},
        "trigger_terms_target": {"email", "credentials", "erp", "portal", "account", "login", "access"},
    },
    {
        "source_domain": "facilities",
        "source_issue": "Hostel Room Vacating & Damage Inspection",
        "target_domain": "fees",
        "target_issue": "Caution Deposit & Refund Clearance",
        "relation_type": "prerequisite_for",
        "explanation": "Physical room clearance and no-damage signoff by the hostel warden is required before Finance can release the caution deposit refund.",
        "trigger_terms_source": {"vacating", "clearance", "dorm", "hostel room", "damage", "inspection"},
        "trigger_terms_target": {"caution deposit", "refund", "deposit", "reimbursement"},
    },
]


class DependencyGraphEngine:
    """Infers cross-domain dependencies from verified workflows and retrieved evidence."""

    def __init__(self, workflows: Optional[List[Dict[str, Any]]] = None):
        self.workflows = workflows or VERIFIED_SYSTEM_WORKFLOWS

    def infer_dependencies(
        self,
        domains: List[str],
        query: str,
        retrieved_contexts: Optional[Dict[str, str]] = None,
    ) -> List[DependencyRelation]:
        """
        Identifies dependencies connecting the active domains for a user query.
        """
        if len(domains) < 2:
            return []

        active_domain_set = set(domains)
        query_lower = query.lower()
        dependencies: List[DependencyRelation] = []

        # 1. Match against verified university system workflows
        for wf in self.workflows:
            s_dom = wf["source_domain"]
            t_dom = wf["target_domain"]

            if s_dom in active_domain_set and t_dom in active_domain_set:
                # Check if query matches trigger concepts for both sides
                s_match = any(t in query_lower for t in wf["trigger_terms_source"])
                t_match = any(t in query_lower for t in wf["trigger_terms_target"])

                # If both concepts are referenced or domains are explicitly active
                if s_match or t_match:
                    evidence_doc = None
                    # 2. Check if retrieved knowledge contains explicit supporting statements
                    if retrieved_contexts:
                        combined_text = (
                            retrieved_contexts.get(s_dom, "") + " " + retrieved_contexts.get(t_dom, "")
                        ).lower()
                        for marker in ["prerequisite", "required before", "hold", "clearance", "blocked until", "conditional upon"]:
                            if marker in combined_text:
                                evidence_doc = f"Retrieved policy mentions requirement: '{marker}'"
                                break

                    dependencies.append(
                        DependencyRelation(
                            source_domain=s_dom,
                            source_issue=wf["source_issue"],
                            target_domain=t_dom,
                            target_issue=wf["target_issue"],
                            relation_type=wf["relation_type"],
                            explanation=wf["explanation"],
                            evidence_source=evidence_doc,
                        )
                    )

        return dependencies

    def sort_execution_order(
        self,
        domains: List[str],
        dependencies: List[DependencyRelation],
    ) -> List[str]:
        """
        Orders domains so prerequisite domains are resolved before dependent domains.
        """
        if not dependencies:
            return list(domains)

        # Build in-degree graph
        prerequisites: Dict[str, Set[str]] = {d: set() for d in domains}
        for dep in dependencies:
            if dep.target_domain in prerequisites and dep.source_domain in domains:
                prerequisites[dep.target_domain].add(dep.source_domain)

        # Topological sort (domains with fewest unmet prerequisites first)
        ordered: List[str] = []
        remaining = set(domains)

        while remaining:
            # Pick a domain whose prerequisites are all already ordered
            ready = [d for d in remaining if not (prerequisites[d] - set(ordered))]
            if not ready:
                # Cycle or break tie
                ready = sorted(list(remaining))
            chosen = ready[0]
            ordered.append(chosen)
            remaining.remove(chosen)

        return ordered
