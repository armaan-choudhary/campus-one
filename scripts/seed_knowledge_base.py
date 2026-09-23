"""CampusOne Institutional Knowledge Base Seeding Script.
Populates PGVector collections for IT, HR, Finance, and Facilities
with grounded policy documents, sections, and metadata.
"""
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from langchain_core.documents import Document
from backend.rag.config import DOMAIN_CONFIG
from backend.index_documents import index_department

DOCUMENTS_BY_DEPARTMENT = {
    "fees": [
        Document(
            page_content=(
                "Tuition Payment Policy and Academic Hold Clearance: "
                "All students must clear semester tuition fees by the designated census deadline "
                "(October 15 for Fall semester, February 15 for Spring semester). "
                "Unpaid fee balances trigger an automatic Financial Hold on the student's central account. "
                "While a financial hold is active, students are blocked from registering for semester examinations, "
                "accessing course grade transcripts, or enrolling in next semester courses. "
                "To lift a financial hold, students must submit proof of fee payment or an approved scholarship "
                "award letter to the Student Accounts & Finance Office (finance@campus.edu)."
            ),
            metadata={
                "source": "finance_bursar_handbook.pdf, page 4",
                "document_name": "Finance & Bursar Student Handbook",
                "page": 4,
                "department": "fees",
            },
        ),
        Document(
            page_content=(
                "Scholarship and Financial Aid Crediting Guidelines: "
                "Students awarded university merit scholarships, state fellowships, or institutional waivers "
                "will have their tuition fee invoices adjusted automatically once the Scholarship Verification "
                "Committee confirms eligibility. If your scholarship has not been credited to your account "
                "before the payment deadline, submit your official Award Verification Letter to the Bursar Office "
                "immediately to request a temporary 30-day payment deferral and hold waiver, ensuring uninterrupted "
                "exam registration."
            ),
            metadata={
                "source": "finance_scholarship_guidelines.pdf, page 2",
                "document_name": "Scholarship & Financial Aid Guidelines",
                "page": 2,
                "department": "fees",
            },
        ),
        Document(
            page_content=(
                "Caution Deposit and Fee Refund Procedure: "
                "Caution deposits are refundable within 30 days of completing university clearance. "
                "For hostel caution deposits, students must first submit the Room Vacating No-Dues Clearance "
                "signed by the Hostel Warden before Finance issues the bank transfer refund."
            ),
            metadata={
                "source": "finance_refund_policy.pdf, page 1",
                "document_name": "Fee Refund & Deposit Policy",
                "page": 1,
                "department": "fees",
            },
        ),
    ],
    "it": [
        Document(
            page_content=(
                "Student Portal & Examination Registration Procedures: "
                "The student portal (portal.campus.edu) is the central system for course enrollment, "
                "exam hall tickets, and examination registration. If your account displays 'Access Restricted: "
                "Academic / Financial Hold', course registration and exam hall ticket downloads will remain locked "
                "until the initiating department (Finance or Registrar) releases the hold flag in the identity management system. "
                "Once Finance clears the hold, system synchronization unlocks exam registration within 15 minutes."
            ),
            metadata={
                "source": "it_student_portal_guide.pdf, page 3",
                "document_name": "Student Portal User Manual",
                "page": 3,
                "department": "it",
            },
        ),
        Document(
            page_content=(
                "Eduroam Wi-Fi and Campus Network Access: "
                "Connect to the 'eduroam' network using your full institutional credentials (username@campus.edu) "
                "and network password. Download the security certificate from iam.campus.edu/certificates. "
                "If authentication fails, reset your credentials through the self-service Identity Access Management portal. "
                "Password changes take effect across all campus access points within 3 minutes."
            ),
            metadata={
                "source": "it_network_policy.pdf, page 1",
                "document_name": "Campus Network & Wi-Fi Policy",
                "page": 1,
                "department": "it",
            },
        ),
        Document(
            page_content=(
                "Identity Management & Multi-Factor Authentication: "
                "Students and staff must set up 2FA via the university IAM portal (iam.campus.edu). "
                "If locked out or authentication prompts fail, request an OTP bypass from the IT Service Desk "
                "or visit the Computer Center Helpdesk with campus photo identification."
            ),
            metadata={
                "source": "it_iam_guide.pdf, page 2",
                "document_name": "Identity & Access Management Guide",
                "page": 2,
                "department": "it",
            },
        ),
    ],
    "facilities": [
        Document(
            page_content=(
                "Hostel Room Allocation and Key Distribution: "
                "Newly admitted and returning students must present their official Hostel Fee Payment Receipt "
                "from Finance to the Warden Office before dormitory room keys are issued. "
                "Room allocations are confirmed only after verification of fee clearance."
            ),
            metadata={
                "source": "facilities_housing_handbook.pdf, page 2",
                "document_name": "Campus Housing Handbook",
                "page": 2,
                "department": "facilities",
            },
        ),
        Document(
            page_content=(
                "Hostel Maintenance and Work Orders: "
                "For repairs including broken air conditioning, leaking bathroom plumbing, water heater/geyser failure, "
                "or electrical issues, submit a maintenance ticket via facilities.campus.edu or call the 24/7 maintenance desk. "
                "Emergency repairs are attended within 2 hours."
            ),
            metadata={
                "source": "facilities_maintenance_manual.pdf, page 1",
                "document_name": "Facilities Maintenance Manual",
                "page": 1,
                "department": "facilities",
            },
        ),
    ],
    "hr": [
        Document(
            page_content=(
                "Faculty & Staff Leave Policy: "
                "Faculty and staff are eligible for casual leave, earned leave, sick leave, and maternity/paternity leave. "
                "Applications must be submitted through the Employee Self-Service portal at hr.campus.edu and approved "
                "by the department head."
            ),
            metadata={
                "source": "hr_leave_policy.pdf, page 2",
                "document_name": "HR Leave Policy Manual",
                "page": 2,
                "department": "hr",
            },
        ),
        Document(
            page_content=(
                "Teaching Assistant and Research Assistant Compensation: "
                "TA/RA stipends and scholarship allowances are disbursed on the 28th of each calendar month. "
                "Any discrepancies in stipend credits must be reported to the Academic Affairs & HR payroll coordinator."
            ),
            metadata={
                "source": "hr_ta_stipend_policy.pdf, page 1",
                "document_name": "TA & Fellow Stipend Policy",
                "page": 1,
                "department": "hr",
            },
        ),
    ],
}


def seed_database():
    print("=" * 70)
    print("SEEDING CAMPUSONE INSTITUTIONAL PGVECTOR KNOWLEDGE BASES")
    print("=" * 70)

    for dept, docs in DOCUMENTS_BY_DEPARTMENT.items():
        col_name = DOMAIN_CONFIG[dept]["collection"]
        print(f"\nIndexing {len(docs)} documents for department '{dept}' into collection '{col_name}'...")
        count = index_department(department=dept, documents=docs)
        print(f"✔ Successfully indexed {count} chunks for '{dept}' ({col_name}).")

    print("\n" + "=" * 70)
    print("✔ KNOWLEDGE BASES SEEDED SUCCESSFULLY ACROSS ALL DEPARTMENTS")
    print("=" * 70)


if __name__ == "__main__":
    seed_database()
