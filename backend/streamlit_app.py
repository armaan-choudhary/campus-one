"""Streamlit console for testing authentication and assistant routing."""
import os
from typing import Any

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
    for key in ("access_token", "user", "messages", "thread_id", "last_routing"):
        st.session_state.pop(key, None)


def load_conversation(token: str) -> list[dict[str, Any]]:
    response = api_request(
        "GET",
        "/api/v1/chat/history",
        headers={"Authorization": f"Bearer {token}"},
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
            st.session_state.access_token = auth_payload["access_token"]
            st.session_state.user = auth_payload["user"]
            st.session_state.messages = load_conversation(auth_payload["access_token"])
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
    st.title("Routing Console")

    with st.sidebar:
        st.success(f"Signed in as {user.get('display_name') or user['email']}")
        st.write(f"Role: `{user['role']}`")
        st.write(f"API: `{API_BASE_URL}`")
        if st.button("Sign out", use_container_width=True):
            reset_session()
            st.rerun()

    left, right = st.columns([1.7, 1], gap="large")
    with left:
        for message in st.session_state.messages:
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
                    json={"message": prompt},
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
