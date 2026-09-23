"""CampusOne Lexical Scorer for Hybrid Routing.
Performs token, alias, and keyword-based matching against domain vocabularies.
"""
import re
from typing import Dict, Set

DOMAINS = ["it", "hr", "fees", "facilities"]

DOMAIN_LEXICAL_TERMS: Dict[str, Set[str]] = {
    "it": {
        "wifi", "wi-fi", "internet", "vpn", "eduroam", "network", "lan", "ethernet",
        "connect", "connection", "connecting",
        "login", "sign-in", "signin", "password", "pwd", "credentials", "2fa", "mfa",
        "portal", "canvas", "lms", "webmail", "email", "outlook", "mailbox",
        "printer", "printing", "credits", "computer", "pc", "laptop", "software",
        "license", "matlab", "ssh", "terminal", "server", "cluster", "hpc",
        "antivirus", "mac", "ip", "dns", "firewall", "hardware", "screen",
        "registration", "register", "registering", "exam", "exams",
    },
    "hr": {
        "salary", "payslip", "pay-slip", "wages", "stipend", "compensation",
        "leave", "vacation", "casual", "sick", "maternity", "paternity", "bereavement",
        "insurance", "medical", "health", "hospital", "claim", "reimbursement",
        "provident", "pf", "pension", "gratuity", "retirement",
        "employment", "employee", "staff", "faculty", "worker", "job", "hiring",
        "appraisal", "evaluation", "promotion", "increment", "performance",
        "resignation", "notice", "clearance", "onboarding", "contract", "hr",
    },
    "fees": {
        "fee", "fees", "tuition", "dues", "payment", "pay", "paid", "paying",
        "receipt", "invoice", "bill", "transaction", "bank", "transfer",
        "neft", "rtgs", "upi", "card", "debit", "credit", "gateway",
        "refund", "reimburse", "deposit", "caution", "installment", "penalty",
        "fine", "late", "due", "deadline", "scholarship", "concession", "waiver",
        "hold", "financial", "bursar", "accounts", "balance",
    },
    "facilities": {
        "hostel", "dorm", "dormitory", "room", "accommodation", "residence",
        "maintenance", "repair", "fix", "broken", "leak", "leaking", "clogged",
        "plumbing", "water", "tap", "pipe", "geyser", "heater", "flush",
        "ac", "air", "conditioning", "cooler", "fan", "light", "bulb", "electricity",
        "power", "outage", "lift", "elevator", "cleaning", "washroom", "bathroom",
        "gym", "gymnasium", "sports", "badminton", "court", "ground",
        "shuttle", "bus", "transport", "parking", "permit", "sticker", "vehicle",
        "projector", "mic", "microphone", "auditorium", "hall", "classroom", "desk", "chair",
    },
}


COMMON_TYPOS = {
    "wiffi": "wifi",
    "interent": "internet",
    "conneting": "connecting",
    "feee": "fee",
    "tution": "tuition",
    "recipt": "receipt",
    "downlaod": "download",
    "hostle": "hostel",
    "salry": "salary",
    "benifit": "benefit",
    "leek": "leak",
    "pluming": "plumbing",
    "netowrk": "network",
}


class LexicalScorer:
    """Computes lexical domain match score based on token and phrase frequency."""

    def __init__(self):
        self.domains = DOMAINS
        self.vocab = DOMAIN_LEXICAL_TERMS

    def score(self, query: str) -> Dict[str, float]:
        """
        Tokenizes query, matches against domain vocabularies, and normalizes scores.
        """
        if not query or not query.strip():
            return {d: 0.25 for d in self.domains}

        raw_tokens = re.findall(r"\b[a-zA-Z0-9_\-]+\b", query.lower())
        tokens = set(COMMON_TYPOS.get(t, t) for t in raw_tokens)
        matches: Dict[str, float] = {d: 0.0 for d in self.domains}

        for domain, terms in self.vocab.items():
            count = sum(1.0 for t in tokens if t in terms)
            matches[domain] = count

        total_matches = sum(matches.values())
        if total_matches == 0:
            # Uniform prior if no lexical tokens match
            return {d: 0.25 for d in self.domains}

        # Add smoothing and normalize
        smoothed = {d: matches[d] + 0.1 for d in self.domains}
        total_smoothed = sum(smoothed.values())
        return {d: float(val / total_smoothed) for d, val in smoothed.items()}
