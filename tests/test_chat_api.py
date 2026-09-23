"""Tests for CampusOne Live Chat API Endpoint (POST /api/v1/chat).
Verifies authentication, validation, single-domain, multi-domain, clarification,
conversation continuation, failure modes, and structured response propagation.
"""
import pytest
from unittest.mock import patch
from httpx import AsyncClient, ASGITransport

from app.main import app
from backend.rag.schemas import DomainRAGResult


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest.fixture
async def auth_token(client: AsyncClient) -> str:
    """Obtains a valid access token for student account."""
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "student@example.edu", "password": "demo-password"},
    )
    assert resp.status_code == 200
    return resp.json()["access_token"]


@pytest.mark.anyio
async def test_1_authenticated_chat_request(client: AsyncClient, auth_token: str):
    """Test 1: Authenticated user can submit a chat query."""
    resp = await client.post(
        "/api/v1/chat",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={"query": "How do I connect to Eduroam Wi-Fi?"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "answer" in data
    assert "conversation_id" in data
    assert data["route_mode"] in ("single", "multi", "clarify")


@pytest.mark.anyio
async def test_2_missing_authentication(client: AsyncClient):
    """Test 2: Unauthenticated request is rejected with 401."""
    resp = await client.post(
        "/api/v1/chat",
        json={"query": "How do I pay fees?"},
    )
    assert resp.status_code == 401
    data = resp.json()
    assert data["error"] == "unauthorized"


@pytest.mark.anyio
async def test_3_invalid_request_empty_query(client: AsyncClient, auth_token: str):
    """Test 3: Empty query returns 422 or 400 validation error."""
    resp = await client.post(
        "/api/v1/chat",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={"query": ""},
    )
    assert resp.status_code in (400, 422)


@pytest.mark.anyio
@patch("backend.graph_nodes.execute_domain_rag")
async def test_4_single_domain_query(mock_rag, client: AsyncClient, auth_token: str):
    """Test 4: Single-domain query resolves correctly with single domain item."""
    mock_rag.return_value = DomainRAGResult(
        answer="Connect to Eduroam by logging in with student credentials.",
        department="it",
        answer_confidence=0.94,
        sources=["it_guide.pdf, page 2"],
        citations=[{"source": "it_guide.pdf", "page": 2, "excerpt": "student credentials"}],
        solved=True,
        human_required=False,
        handoff_reason=None,
    )

    resp = await client.post(
        "/api/v1/chat",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={"query": "How do I configure the campus Wi-Fi network?"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["route_mode"] == "single"
    assert data["department"] == "it"
    assert len(data["domains"]) == 1
    assert data["domains"][0]["department"] == "it"
    assert data["confidence"] > 0.5


@pytest.mark.anyio
@patch("backend.orchestration.engine.execute_domain_rag")
async def test_5_multi_domain_query(mock_rag, client: AsyncClient, auth_token: str):
    """Test 5: Multi-domain query returns multi mode with multiple domain resolutions."""
    def side_effect(query, department, conversation_context=None):
        if department == "fees":
            return DomainRAGResult(
                answer="Fees must be cleared by October 15.",
                department="fees",
                answer_confidence=0.91,
                sources=["fees_calendar.pdf"],
                citations=[{"source": "fees_calendar.pdf", "page": 1, "excerpt": "October 15"}],
                solved=True,
                human_required=False,
                handoff_reason=None,
            )
        elif department == "it":
            return DomainRAGResult(
                answer="Portal password reset is handled via IAM portal.",
                department="it",
                answer_confidence=0.89,
                sources=["iam_guide.pdf"],
                citations=[{"source": "iam_guide.pdf", "page": 3, "excerpt": "IAM portal"}],
                solved=True,
                human_required=False,
                handoff_reason=None,
            )
        raise ValueError(f"Unexpected department {department}")

    mock_rag.side_effect = side_effect

    resp = await client.post(
        "/api/v1/chat",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={"query": "My fee payment failed and now I can't access the student portal."},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["route_mode"] == "multi"
    assert len(data["domains"]) == 2
    domain_names = {d["department"] for d in data["domains"]}
    assert domain_names == {"fees", "it"}
    assert len(data["next_steps"]) >= 1


@pytest.mark.anyio
async def test_6_clarification_query(client: AsyncClient, auth_token: str):
    """Test 6: Ambiguous query triggers requires_clarification with options."""
    resp = await client.post(
        "/api/v1/chat",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={"query": "My account is blocked and I need help"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["requires_clarification"] is True
    assert "clarify" in data["answer"].lower()
    assert len(data["clarification_options"]) >= 1


@pytest.mark.anyio
@patch("backend.graph_nodes.execute_domain_rag")
async def test_7_conversation_continuation(mock_rag, client: AsyncClient, auth_token: str):
    """Test 7: Providing conversation_id preserves thread history across turns."""
    mock_rag.return_value = DomainRAGResult(
        answer="Tuition info.",
        department="fees",
        answer_confidence=0.9,
        sources=[],
        citations=[],
        solved=True,
        human_required=False,
        handoff_reason=None,
    )

    conv_id = "test_conv_persistence_42"

    # Turn 1
    resp1 = await client.post(
        "/api/v1/chat",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={"query": "What is the tuition fee deadline?", "conversation_id": conv_id},
    )
    assert resp1.status_code == 200
    assert resp1.json()["conversation_id"] == conv_id

    # Turn 2 with same conversation_id
    mock_rag.return_value = DomainRAGResult(
        answer="IT Wi-Fi details.",
        department="it",
        answer_confidence=0.9,
        sources=[],
        citations=[],
        solved=True,
        human_required=False,
        handoff_reason=None,
    )

    resp2 = await client.post(
        "/api/v1/chat",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={"query": "Also how do I connect to campus Wi-Fi?", "conversation_id": conv_id},
    )
    assert resp2.status_code == 200
    assert resp2.json()["conversation_id"] == conv_id


@pytest.mark.anyio
@patch("app.api.v1.endpoints.chat.run_workflow")
async def test_8_backend_orchestration_failure(mock_wf, client: AsyncClient, auth_token: str):
    """Test 8: Unhandled backend error returns 500 without crashing FastAPI."""
    mock_wf.side_effect = RuntimeError("Catastrophic database connection timeout")

    resp = await client.post(
        "/api/v1/chat",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={"query": "Any query"},
    )
    assert resp.status_code == 500
    data = resp.json()
    assert data["error"] == "orchestration_failure"
    assert "Catastrophic database connection timeout" in data["message"]


@pytest.mark.anyio
@patch("backend.graph_nodes.execute_domain_rag")
async def test_9_correct_structured_response_fields(mock_rag, client: AsyncClient, auth_token: str):
    """Test 9: Response contains all canonical contract fields."""
    mock_rag.return_value = DomainRAGResult(
        answer="Clean answer.",
        department="it",
        answer_confidence=0.88,
        sources=["it.pdf"],
        citations=[],
        solved=True,
        human_required=False,
        handoff_reason=None,
    )

    resp = await client.post(
        "/api/v1/chat",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={"query": "How do I reset my password?"},
    )
    assert resp.status_code == 200
    data = resp.json()
    expected_fields = [
        "answer", "conversation_id", "route_mode", "department", "domains",
        "confidence", "sources", "citations", "next_steps",
        "requires_clarification", "clarification_options",
        "human_required", "handoff_reason",
    ]
    for field in expected_fields:
        assert field in data, f"Field '{field}' missing from response"


@pytest.mark.anyio
@patch("backend.graph_nodes.execute_domain_rag")
async def test_10_citation_propagation(mock_rag, client: AsyncClient, auth_token: str):
    """Test 10: Retrieved citations propagate accurately into response."""
    mock_rag.return_value = DomainRAGResult(
        answer="Password recovery procedure.",
        department="it",
        answer_confidence=0.95,
        sources=["it_security_manual.pdf, page 4"],
        citations=[
            {
                "id": "cit-manual-01",
                "source": "it_security_manual.pdf",
                "page": 4,
                "excerpt": "Navigate to identity portal and enter OTP",
            }
        ],
        solved=True,
        human_required=False,
        handoff_reason=None,
    )

    resp = await client.post(
        "/api/v1/chat",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={"query": "How do I reset my password?"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["citations"]) >= 1
    cit = data["citations"][0]
    assert cit["title"] == "it_security_manual.pdf"
    assert "Page 4" in cit["section"]
    assert "identity portal" in cit["excerpt"]
