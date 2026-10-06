"""Persistent PostgreSQL-backed conversation index for student inquiry sessions."""
import logging
import secrets
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from app.core.database import get_db_pool

logger = logging.getLogger(__name__)


class ConversationStore:
    """Manages student conversation directory records in PostgreSQL."""

    async def init_schema(self) -> None:
        """Create campus_conversations table and indexes if not already present."""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            await conn.execute(
                """
                CREATE TABLE IF NOT EXISTS campus_conversations (
                    id VARCHAR(128) PRIMARY KEY,
                    user_id VARCHAR(128) NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    domain_key VARCHAR(64) NOT NULL DEFAULT 'it',
                    status VARCHAR(32) NOT NULL DEFAULT 'open',
                    pinned BOOLEAN NOT NULL DEFAULT FALSE,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );
                CREATE INDEX IF NOT EXISTS idx_campus_conv_user ON campus_conversations(user_id, updated_at DESC);
                """
            )
            logger.info("Initialized campus_conversations schema")

    @staticmethod
    def _row_to_dict(row: Any) -> Dict[str, Any]:
        return {
            "id": row["id"],
            "user_id": row["user_id"],
            "title": row["title"],
            "domain_key": row["domain_key"],
            "status": row["status"],
            "pinned": row["pinned"],
            "created_at": row["created_at"].isoformat() if row["created_at"] else None,
            "updated_at": row["updated_at"].isoformat() if row["updated_at"] else None,
        }

    async def list_conversations(self, user_id: str) -> List[Dict[str, Any]]:
        """Return all conversations belonging to user_id ordered by pinned and updated_at."""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT id, user_id, title, domain_key, status, pinned, created_at, updated_at
                FROM campus_conversations
                WHERE user_id = $1
                ORDER BY pinned DESC, updated_at DESC
                """,
                user_id,
            )
            return [self._row_to_dict(r) for r in rows]

    async def get_conversation(self, user_id: str, conversation_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a specific conversation belonging to user_id."""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT id, user_id, title, domain_key, status, pinned, created_at, updated_at
                FROM campus_conversations
                WHERE user_id = $1 AND id = $2
                """,
                user_id,
                conversation_id,
            )
            return self._row_to_dict(row) if row else None

    async def create_conversation(
        self,
        user_id: str,
        conversation_id: Optional[str] = None,
        title: Optional[str] = None,
        domain_key: str = "it",
    ) -> Dict[str, Any]:
        """Create a new conversation session record for user_id."""
        conv_id = conversation_id or f"conv-{secrets.token_hex(6)}"
        conv_title = (title or "New inquiry").strip()[:250]

        pool = await get_db_pool()
        async with pool.acquire() as conn:
            existing = await conn.fetchrow(
                "SELECT user_id FROM campus_conversations WHERE id = $1", conv_id
            )
            if existing:
                if existing["user_id"] != user_id:
                    raise PermissionError("Conversation identifier belongs to another user")
                row = await conn.fetchrow(
                    """
                    UPDATE campus_conversations
                    SET updated_at = NOW(),
                        title = CASE WHEN title = 'New inquiry' THEN $3 ELSE title END
                    WHERE id = $1 AND user_id = $2
                    RETURNING id, user_id, title, domain_key, status, pinned, created_at, updated_at
                    """,
                    conv_id,
                    user_id,
                    conv_title,
                )
                return self._row_to_dict(row)

            row = await conn.fetchrow(
                """
                INSERT INTO campus_conversations
                    (id, user_id, title, domain_key, status, pinned, created_at, updated_at)
                VALUES ($1, $2, $3, $4, 'open', FALSE, NOW(), NOW())
                RETURNING id, user_id, title, domain_key, status, pinned, created_at, updated_at
                """,
                conv_id,
                user_id,
                conv_title,
                domain_key,
            )
            return self._row_to_dict(row)

    async def touch_conversation(
        self,
        user_id: str,
        conversation_id: str,
        first_query: Optional[str] = None,
        domain_key: Optional[str] = None,
        status: Optional[str] = None,
    ) -> None:
        """Upsert conversation state when a user sends or continues a message thread."""
        default_title = "New inquiry"
        if first_query:
            clean_q = first_query.strip().replace("\n", " ")
            default_title = (clean_q[:40] + ("..." if len(clean_q) > 40 else "")) or "New inquiry"

        pool = await get_db_pool()
        async with pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO campus_conversations
                    (id, user_id, title, domain_key, status, pinned, created_at, updated_at)
                VALUES ($1, $2, $3, COALESCE($4, 'it'), COALESCE($5, 'open'), FALSE, NOW(), NOW())
                ON CONFLICT (id) DO UPDATE SET
                    updated_at = NOW(),
                    title = CASE
                        WHEN campus_conversations.title = 'New inquiry' AND $3 != 'New inquiry'
                        THEN $3
                        ELSE campus_conversations.title
                    END,
                    domain_key = COALESCE($4, campus_conversations.domain_key),
                    status = COALESCE($5, campus_conversations.status)
                WHERE campus_conversations.user_id = $2
                """,
                conversation_id,
                user_id,
                default_title[:250],
                domain_key,
                status,
            )

    async def update_conversation(
        self,
        user_id: str,
        conversation_id: str,
        title: Optional[str] = None,
        pinned: Optional[bool] = None,
        status: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Update metadata on an existing conversation record."""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                UPDATE campus_conversations
                SET
                    title = COALESCE($3, title),
                    pinned = COALESCE($4, pinned),
                    status = COALESCE($5, status),
                    updated_at = NOW()
                WHERE user_id = $1 AND id = $2
                RETURNING id, user_id, title, domain_key, status, pinned, created_at, updated_at
                """,
                user_id,
                conversation_id,
                title.strip()[:250] if title else None,
                pinned,
                status,
            )
            return self._row_to_dict(row) if row else None

    async def delete_conversation(self, user_id: str, conversation_id: str) -> bool:
        """Delete a conversation record belonging to user_id."""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            result = await conn.execute(
                """
                DELETE FROM campus_conversations
                WHERE user_id = $1 AND id = $2
                """,
                user_id,
                conversation_id,
            )
            return result == "DELETE 1"


conversation_store = ConversationStore()
