"""Persistent PostgreSQL-backed ticket store for student escalations and admin triage."""
import logging
import secrets
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from app.core.database import get_db_pool

logger = logging.getLogger(__name__)


class TicketStore:
    """Manages escalation tickets in PostgreSQL."""

    async def init_schema(self) -> None:
        """Create campus_tickets table and indexes if not already present."""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            await conn.execute(
                """
                CREATE TABLE IF NOT EXISTS campus_tickets (
                    id VARCHAR(128) PRIMARY KEY,
                    user_id VARCHAR(128) NOT NULL,
                    student_email VARCHAR(255),
                    student_name VARCHAR(255),
                    department VARCHAR(128) NOT NULL,
                    reason TEXT NOT NULL,
                    urgency VARCHAR(32) NOT NULL DEFAULT 'normal',
                    status VARCHAR(32) NOT NULL DEFAULT 'pending',
                    preview TEXT,
                    resolution_note TEXT,
                    assigned_to VARCHAR(128),
                    resolved_at TIMESTAMPTZ,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );
                CREATE INDEX IF NOT EXISTS idx_campus_tickets_user ON campus_tickets(user_id, updated_at DESC);
                CREATE INDEX IF NOT EXISTS idx_campus_tickets_email ON campus_tickets(student_email, updated_at DESC);
                CREATE INDEX IF NOT EXISTS idx_campus_tickets_status ON campus_tickets(status, updated_at DESC);
                """
            )
            logger.info("Initialized campus_tickets schema")

    @staticmethod
    def _row_to_dict(row: Any) -> Dict[str, Any]:
        return {
            "ticketId": row["id"],
            "userId": row["user_id"],
            "studentEmail": row["student_email"],
            "studentName": row["student_name"],
            "department": row["department"],
            "reason": row["reason"],
            "urgency": row["urgency"],
            "status": row["status"],
            "preview": row["preview"] or row["reason"],
            "resolutionNote": row["resolution_note"],
            "assignedTo": row["assigned_to"],
            "resolvedAt": row["resolved_at"].isoformat() if row["resolved_at"] else None,
            "createdAt": row["created_at"].isoformat() if row["created_at"] else None,
            "updatedAt": row["updated_at"].isoformat() if row["updated_at"] else None,
        }

    async def list_tickets(
        self,
        user_id: Optional[str] = None,
        email: Optional[str] = None,
        is_admin: bool = False,
    ) -> List[Dict[str, Any]]:
        """Return tickets scoped to the user, or all tickets if admin."""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            if is_admin:
                rows = await conn.fetch(
                    """
                    SELECT id, user_id, student_email, student_name, department,
                           reason, urgency, status, preview, resolution_note,
                           assigned_to, resolved_at, created_at, updated_at
                    FROM campus_tickets
                    ORDER BY created_at DESC
                    """
                )
            else:
                user_id_param = user_id or ""
                email_param = (email or "").lower()
                rows = await conn.fetch(
                    """
                    SELECT id, user_id, student_email, student_name, department,
                           reason, urgency, status, preview, resolution_note,
                           assigned_to, resolved_at, created_at, updated_at
                    FROM campus_tickets
                    WHERE user_id = $1 OR (student_email IS NOT NULL AND LOWER(student_email) = $2)
                    ORDER BY created_at DESC
                    """,
                    user_id_param,
                    email_param,
                )
            return [self._row_to_dict(r) for r in rows]

    async def create_ticket(
        self,
        id: Optional[str],
        user_id: str,
        student_email: Optional[str],
        student_name: Optional[str],
        department: str,
        reason: str,
        urgency: str = "normal",
        preview: Optional[str] = None,
        status: str = "pending",
    ) -> Dict[str, Any]:
        """Create or update a ticket in PostgreSQL."""
        pool = await get_db_pool()
        ticket_id = id or f"TKT-{secrets.token_hex(4).upper()}"
        if not ticket_id.startswith("#") and not ticket_id.startswith("TKT-"):
            ticket_id = f"TKT-{ticket_id}"

        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO campus_tickets (
                    id, user_id, student_email, student_name, department,
                    reason, urgency, status, preview, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
                ON CONFLICT (id) DO UPDATE SET
                    department = EXCLUDED.department,
                    reason = EXCLUDED.reason,
                    urgency = EXCLUDED.urgency,
                    preview = EXCLUDED.preview,
                    updated_at = NOW()
                RETURNING id, user_id, student_email, student_name, department,
                          reason, urgency, status, preview, resolution_note,
                          assigned_to, resolved_at, created_at, updated_at
                """,
                ticket_id,
                user_id,
                student_email,
                student_name,
                department,
                reason,
                urgency,
                status,
                preview or reason,
            )
            return self._row_to_dict(row)

    async def update_ticket_status(
        self,
        ticket_id: str,
        status: str,
        resolution_note: Optional[str] = None,
        assigned_to: Optional[str] = None,
        user_id: Optional[str] = None,
        is_admin: bool = False,
    ) -> Optional[Dict[str, Any]]:
        """Update ticket status, note, or assignment."""
        pool = await get_db_pool()
        resolved_at = datetime.now(timezone.utc) if status == "resolved" else None

        async with pool.acquire() as conn:
            # Check ownership if not admin
            if not is_admin and user_id:
                owner_check = await conn.fetchval(
                    "SELECT user_id FROM campus_tickets WHERE id = $1", ticket_id
                )
                if not owner_check:
                    return None
                if owner_check != user_id:
                    raise PermissionError("Cannot modify tickets belonging to other accounts")

            row = await conn.fetchrow(
                """
                UPDATE campus_tickets
                SET status = $2::varchar,
                    resolution_note = COALESCE($3::text, resolution_note),
                    assigned_to = COALESCE($4::varchar, assigned_to),
                    resolved_at = CASE WHEN $2::varchar = 'resolved' THEN NOW() ELSE resolved_at END,
                    updated_at = NOW()
                WHERE id = $1
                RETURNING id, user_id, student_email, student_name, department,
                          reason, urgency, status, preview, resolution_note,
                          assigned_to, resolved_at, created_at, updated_at
                """,
                ticket_id,
                status,
                resolution_note,
                assigned_to,
            )
            return self._row_to_dict(row) if row else None

    async def delete_ticket(
        self, ticket_id: str, user_id: Optional[str] = None, is_admin: bool = False
    ) -> bool:
        """Delete a ticket by ID."""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            if not is_admin and user_id:
                res = await conn.execute(
                    "DELETE FROM campus_tickets WHERE id = $1 AND user_id = $2",
                    ticket_id,
                    user_id,
                )
            else:
                res = await conn.execute(
                    "DELETE FROM campus_tickets WHERE id = $1", ticket_id
                )
            return "DELETE 1" in res


ticket_store = TicketStore()
