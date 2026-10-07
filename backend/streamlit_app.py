"""Streamlit console for testing authentication and assistant routing."""
import os
from typing import Any, Optional

import httpx
import streamlit as st


st.set_page_config(
    page_title="CampusOne Auth and Routing Console",
    page_icon="C",
    layout="wide",
)

API_BASE_URL = os.getenv("CAMPUSONE_API_URL", "http://localhost:8000").rstrip("/")


def api_request(method: str, path: str, **kwargs: Any) -> httpx.Response:
    return httpx.request(
        method,
        f"{API_BASE_URL}{path}",
        timeout=120.0,
        **kwargs,
    )


def reset_session() -> None:
    for key in (
        "access_token",
        "user",
        "messages",
        "thread_id",
        "last_routing",
        "conversations",
        "active_conv_id",
        "conv_selector",
    ):
        st.session_state.pop(key, None)


def fetch_conversations(token: str) -> list[dict[str, Any]]:
    response = api_request(
        "GET",
        "/api/v1/chat/conversations",
        headers={"Authorization": f"Bearer {token}"},
    )
    if response.is_success:
        return response.json()
    return []


def create_new_conversation(token: str, title: str = "New inquiry") -> Optional[dict[str, Any]]:
    response = api_request(
        "POST",
        "/api/v1/chat/conversations",
        headers={"Authorization": f"Bearer {token}"},
        json={"title": title},
    )
    if response.is_success:
        return response.json()
    return None


def delete_conversation_api(token: str, conv_id: str) -> bool:
    response = api_request(
        "DELETE",
        f"/api/v1/chat/conversations/{conv_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    return response.is_success


def load_conversation(token: str, conversation_id: Optional[str] = None) -> list[dict[str, Any]]:
    params = {"conversation_id": conversation_id} if conversation_id else {}
    response = api_request(
        "GET",
        "/api/v1/chat/history",
        headers={"Authorization": f"Bearer {token}"},
        params=params,
    )
    if response.is_success:
        payload = response.json()
        st.session_state.thread_id = payload.get("thread_id")
        return payload.get("messages", [])

    detail = response.json().get("message", response.text)
    st.warning(f"Previous conversation could not be loaded: {detail}")
    return []


def login_panel() -> None:
    st.title("CampusOne Test Console")
    st.caption("Authentication and routing smoke test")

    sign_in, sign_up = st.tabs(["Sign in", "Create account"])
    with sign_in:
        with st.form("login"):
            email = st.text_input("Email", value="student@example.edu")
            password = st.text_input("Password", value="demo-password", type="password")
            submitted = st.form_submit_button("Sign in", type="primary")

        if submitted:
            authenticate_user("/api/v1/auth/login", {"email": email, "password": password})

    with sign_up:
        with st.form("signup"):
            display_name = st.text_input("Name")
            email = st.text_input("Campus email")
            password = st.text_input("Password", type="password")
            confirm_password = st.text_input("Confirm password", type="password")
            submitted = st.form_submit_button("Create student account", type="primary")

        if submitted:
            if password != confirm_password:
                st.error("Passwords do not match.")
            elif not display_name.strip():
                st.error("Enter your name.")
            else:
                authenticate_user(
                    "/api/v1/auth/register",
                    {"display_name": display_name, "email": email, "password": password},
                )


def authenticate_user(path: str, payload: dict[str, str]) -> None:
    try:
        response = api_request("POST", path, json=payload)
        if response.is_success:
            auth_payload = response.json()
            token = auth_payload["access_token"]
            st.session_state.access_token = token
            st.session_state.user = auth_payload["user"]

            # Load or provision conversation directory
            convs = fetch_conversations(token)
            if not convs:
                new_conv = create_new_conversation(token)
                convs = [new_conv] if new_conv else []

            st.session_state.conversations = convs
            active_id = convs[0]["id"] if convs else None
            st.session_state.active_conv_id = active_id
            st.session_state.conv_selector = active_id
            st.session_state.messages = load_conversation(token, active_id)
            st.session_state.last_routing = None
            st.rerun()
        else:
            detail = response.json().get("message", response.text)
            st.error(f"{'Signup' if path.endswith('register') else 'Login'} failed: {detail}")
    except httpx.HTTPError as exc:
        st.error(f"API unavailable: {exc}")


def chat_panel() -> None:
    user = st.session_state.user
    token = st.session_state.access_token

    # Ensure conversations list is present
    if "conversations" not in st.session_state or st.session_state.conversations is None:
        st.session_state.conversations = fetch_conversations(token)
        if not st.session_state.conversations:
            new_conv = create_new_conversation(token)
            st.session_state.conversations = [new_conv] if new_conv else []
        active_default = (
            st.session_state.conversations[0]["id"] if st.session_state.conversations else None
        )
        st.session_state.active_conv_id = active_default
        st.session_state.conv_selector = active_default
        st.session_state.messages = load_conversation(token, active_default)

    convs = st.session_state.conversations
    active_id = st.session_state.get("active_conv_id")

    with st.sidebar:
        st.success(f"Signed in as {user.get('display_name') or user['email']}")
        st.write(f"Role: `{user['role']}`")
        st.write(f"API: `{API_BASE_URL}`")

        st.divider()
        st.subheader("Inquiries & Threads")

        if st.button("+ New Inquiry", use_container_width=True, type="primary"):
            new_conv = create_new_conversation(token)
            if new_conv:
                st.session_state.conversations = fetch_conversations(token)
                st.session_state.active_conv_id = new_conv["id"]
                st.session_state.conv_selector = new_conv["id"]
                st.session_state.messages = []
                st.session_state.last_routing = None
                st.rerun()

        if convs:
            conv_options = {c["id"]: f"{c.get('title') or 'New inquiry'} ({c['id'][-8:]})" for c in convs}
            conv_ids = list(conv_options.keys())

            # Guard against invalid conv_selector key in session state
            if st.session_state.get("conv_selector") not in conv_ids:
                st.session_state.conv_selector = active_id if active_id in conv_ids else conv_ids[0]

            def on_conversation_change() -> None:
                new_sel = st.session_state.get("conv_selector")
                if new_sel:
                    st.session_state.active_conv_id = new_sel
                    st.session_state.messages = load_conversation(token, new_sel)
                    st.session_state.last_routing = None

            current_index = conv_ids.index(st.session_state.conv_selector)

            st.selectbox(
                "Select Conversation",
                options=conv_ids,
                index=current_index,
                format_func=lambda cid: conv_options.get(cid, cid),
                key="conv_selector",
                on_change=on_conversation_change,
            )

            if st.button("Delete this thread", use_container_width=True):
                if active_id:
                    delete_conversation_api(token, active_id)
                    convs = fetch_conversations(token)
                    if not convs:
                        new_conv = create_new_conversation(token)
                        convs = [new_conv] if new_conv else []
                    st.session_state.conversations = convs
                    next_id = convs[0]["id"] if convs else None
                    st.session_state.active_conv_id = next_id
                    st.session_state.conv_selector = next_id
                    st.session_state.messages = load_conversation(token, next_id)
                    st.session_state.last_routing = None
                    st.rerun()

        st.divider()
        if st.button("Sign out", use_container_width=True):
            reset_session()
            st.rerun()

    active_conv_title = "Inquiry Session"
    if convs and active_id:
        for c in convs:
            if c["id"] == active_id:
                active_conv_title = c.get("title", "Inquiry Session")
                break

    left, right = st.columns([1.7, 1], gap="large")
    with left:
        st.title(active_conv_title)
        st.caption(f"Active thread: `{active_id}`")

        for message in st.session_state.get("messages", []):
            with st.chat_message(message["role"]):
                st.markdown(message["content"])

        prompt = st.chat_input("Send a message to test routing")
        if prompt:
            st.session_state.messages.append({"role": "user", "content": prompt})
            with st.chat_message("user"):
                st.markdown(prompt)

            try:
                response = api_request(
                    "POST",
                    "/api/v1/chat",
                    headers={"Authorization": f"Bearer {token}"},
                    json={"message": prompt, "conversation_id": active_id},
                )
                if response.is_success:
                    payload = response.json()
                    answer = payload.get("answer", "")
                    st.session_state.messages.append(
                        {"role": "assistant", "content": answer}
                    )
                    with st.chat_message("assistant"):
                        st.markdown(answer)
                    st.session_state.last_routing = payload
                    # Refresh conversation list to update titles
                    st.session_state.conversations = fetch_conversations(token)
                else:
                    detail = response.json().get("message", response.text)
                    st.error(f"Chat failed: {detail}")
            except httpx.HTTPError as exc:
                st.error(f"API unavailable: {exc}")

    with right:
        st.subheader("Routing inspection")
        routing = st.session_state.get("last_routing")
        if routing:
            st.metric(
                "Confidence",
                f"{routing.get('routing_confidence', 0.0):.0%}",
            )
            st.write("Intent", routing.get("intent") or "Unknown")
            st.write("Departments", ", ".join(routing.get("detected_domains", [])))
            st.write("Thread ID", routing.get("thread_id"))
            st.write("Solved", routing.get("solved", False))
            if routing.get("sources"):
                st.write("Sources")
                for source in routing["sources"]:
                    st.caption(source)

            if routing.get("ticket_id") or routing.get("ticket"):
                st.subheader("Raised ticket")
                st.success(
                    f"Ticket raised: {routing.get('ticket_id', 'Unknown ticket')}"
                )
                ticket = routing.get("ticket")
                if ticket:
                    st.json(ticket)

            chunks = routing.get("retrieved_chunks", [])
            st.subheader("Retrieved chunks")
            if not chunks:
                st.info("No retrieved chunks were returned for this response.")
            else:
                st.caption(
                    "Exact document text passed to the domain agent, including page metadata."
                )
                for index, chunk in enumerate(chunks, start=1):
                    source = chunk.get("source", "Unknown document")
                    page = chunk.get("page")
                    location = f"{source}, page {page}" if page else source
                    with st.expander(f"Chunk {index}: {location}"):
                        st.code(chunk.get("content", ""), language="text")
                        st.json(chunk.get("metadata", {}))
        else:
            st.info("Send a message to inspect its route.")


if "access_token" not in st.session_state:
    login_panel()
else:
    chat_panel()
