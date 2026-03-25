from __future__ import annotations

import asyncio
from typing import Any, Dict, Optional
from uuid import UUID

from fastapi import WebSocket


class SeatsWsManager:
    """
    In-process WebSocket manager for seat updates.

    This repo runs in a single process (hackathon / small deploy),
    so an in-memory manager is enough for real-time UI updates.
    """

    def __init__(self) -> None:
        self._connections: Dict[UUID, set[WebSocket]] = {}
        self._lock = asyncio.Lock()
        self._loop: Optional[asyncio.AbstractEventLoop] = None

    def set_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        self._loop = loop

    async def connect(self, event_id: UUID, ws: WebSocket) -> None:
        await ws.accept()
        async with self._lock:
            self._connections.setdefault(event_id, set()).add(ws)

    async def disconnect(self, event_id: UUID, ws: WebSocket) -> None:
        async with self._lock:
            conns = self._connections.get(event_id)
            if not conns:
                return
            conns.discard(ws)
            if len(conns) == 0:
                self._connections.pop(event_id, None)

    async def broadcast(self, event_id: UUID, message: Dict[str, Any]) -> None:
        async with self._lock:
            conns = list(self._connections.get(event_id, set()))

        if not conns:
            return

        # Best-effort: if a socket is dead, disconnect it.
        for ws in conns:
            try:
                await ws.send_json(message)
            except Exception:
                await self.disconnect(event_id, ws)

    def broadcast_sync(self, event_id: UUID, message: Dict[str, Any]) -> None:
        """
        Safe to call from sync endpoints (threadpool).
        """
        if self._loop is None:
            return

        try:
            fut = asyncio.run_coroutine_threadsafe(self.broadcast(event_id, message), self._loop)
        except RuntimeError:
            return

        def _swallow_errors(_fut: asyncio.Future[Any]) -> None:
            try:
                _fut.result()
            except Exception:
                pass

        fut.add_done_callback(_swallow_errors)


seats_ws_manager = SeatsWsManager()

