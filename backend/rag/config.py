"""CampusOne Unified RAG Configuration and Domain Registry."""
from typing import Dict, Any

DOMAIN_CONFIG: Dict[str, Dict[str, Any]] = {
    "it": {
        "collection": "it_knowledge",
        "display_name": "IT",
        "description": "IT services, Wi-Fi, email, passwords, login, student portal, hardware, VPN",
    },
    "hr": {
        "collection": "hr_knowledge",
        "display_name": "HR",
        "description": "Human resources, employee benefits, payroll, leave policy, staff hiring, employment verification",
    },
    "fees": {
        "collection": "finance_knowledge",
        "display_name": "Fees",
        "description": "Tuition fees, payment deadlines, refund policy, fee receipts, payment gateways, financial holds, installments",
    },
    "facilities": {
        "collection": "facilities_knowledge",
        "display_name": "Facilities",
        "description": "Campus facilities, hostel maintenance, room allocation, library hours, sports complex, gym, parking, lab access",
    },
}

SUPPORTED_DOMAINS = list(DOMAIN_CONFIG.keys())

# Canonical alias mapping
DOMAIN_ALIASES = {
    "it": "it",
    "information technology": "it",
    "tech": "it",
    "hr": "hr",
    "human resources": "hr",
    "personnel": "hr",
    "fees": "fees",
    "finance": "fees",
    "fees and finance": "fees",
    "accounts": "fees",
    "bursar": "fees",
    "facilities": "facilities",
    "facilities and maintenance": "facilities",
    "estate": "facilities",
    "maintenance": "facilities",
}

def normalize_department(dept: str) -> str:
    """Normalize department name or alias to canonical department key."""
    if not dept or not isinstance(dept, str):
        raise ValueError(f"Invalid department identifier: {dept}")
    cleaned = dept.strip().lower()
    if cleaned in DOMAIN_ALIASES:
        return DOMAIN_ALIASES[cleaned]
    if cleaned in DOMAIN_CONFIG:
        return cleaned
    raise ValueError(
        f"Unsupported department '{dept}'. Supported departments are: {SUPPORTED_DOMAINS}"
    )
