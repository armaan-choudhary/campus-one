"""API endpoints for student escalation tickets and admin triage."""
import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.auth.dependencies import get_current_user
from app.auth.schemas import CurrentUser, Role
from app.tickets import ticket_store

logger = logging.getLogger(__name__)

router = APIRouter()


class TicketResponse(BaseModel):
    ticketId: str
    userId: str
    studentEmail: Optional[str] = None
    studentName: Optional[str] = None
    department: str
    reason: str
    urgency: str = "normal"
    status: str = "pending"
    preview: Optional[str] = None
    resolutionNote: Optional[str] = None
    assignedTo: Optional[str] = None
    resolvedAt: Optional[str] = None
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None


class CreateTicketRequest(BaseModel):
    ticketId: Optional[str] = Field(None, max_length=128)
    department: str = Field(..., min_length=1, max_length=128)
    reason: str = Field(..., min_length=1, max_length=2000)
    urgency: Optional[str] = Field("normal", max_length=32)
    preview: Optional[str] = Field(None, max_length=2000)


class UpdateTicketRequest(BaseModel):
    status: Optional[str] = Field(None, max_length=32)
    resolutionNote: Optional[str] = Field(None, max_length=2000)
    assignedTo: Optional[str] = Field(None, max_length=128)


@router.get(
    "",
    response_model=List[TicketResponse],
    summary="List escalation tickets",
    description="Retrieve tickets for the current authenticated user (or all tickets if administrator).",
)
async def list_tickets(
    current_user: CurrentUser = Depends(get_current_user),
) -> List[TicketResponse]:
    is_admin = current_user.role in (Role.ADMIN, Role.SUPPORT_AGENT)
    tickets = await ticket_store.list_tickets(
        user_id=current_user.id,
        email=current_user.email,
        is_admin=is_admin,
    )
    return [TicketResponse(**t) for t in tickets]


@router.post(
    "",
    response_model=TicketResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new escalation ticket",
    description="Register a support inquiry associated with the authenticated student account.",
)
async def create_ticket(
    request: CreateTicketRequest,
    current_user: CurrentUser = Depends(get_current_user),
) -> TicketResponse:
    student_name = current_user.display_name or (
        f"{current_user.email.split('@')[0]} (Student)"
    )
    ticket = await ticket_store.create_ticket(
        id=request.ticketId,
        user_id=current_user.id,
        student_email=current_user.email,
        student_name=student_name,
        department=request.department,
        reason=request.reason,
        urgency=request.urgency or "normal",
        preview=request.preview or request.reason,
        status="pending",
    )
    return TicketResponse(**ticket)


@router.patch(
    "/{ticket_id}",
    response_model=TicketResponse,
    summary="Update ticket status or triage details",
    description="Update status, resolution note, or assigned technician for a support ticket.",
)
async def update_ticket(
    ticket_id: str,
    request: UpdateTicketRequest,
    current_user: CurrentUser = Depends(get_current_user),
) -> TicketResponse:
    is_admin = current_user.role in (Role.ADMIN, Role.SUPPORT_AGENT)
    try:
        updated = await ticket_store.update_ticket_status(
            ticket_id=ticket_id,
            status=request.status or "pending",
            resolution_note=request.resolutionNote,
            assigned_to=request.assignedTo,
            user_id=current_user.id,
            is_admin=is_admin,
        )
    except PermissionError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": "forbidden", "message": "You cannot modify tickets belonging to other accounts"},
        )

    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "not_found", "message": f"Ticket {ticket_id} was not found"},
        )

    return TicketResponse(**updated)


@router.delete(
    "/{ticket_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete support ticket",
    description="Remove a support ticket record.",
)
async def delete_ticket(
    ticket_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    is_admin = current_user.role in (Role.ADMIN, Role.SUPPORT_AGENT)
    deleted = await ticket_store.delete_ticket(
        ticket_id=ticket_id,
        user_id=current_user.id,
        is_admin=is_admin,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "not_found", "message": f"Ticket {ticket_id} was not found"},
        )
