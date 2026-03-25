from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.realtime.seats_ws import seats_ws_manager

router = APIRouter()


@router.websocket("/ws/seats/{event_id}")
async def seats_updates_ws(ws: WebSocket, event_id: UUID):
    """
    Real-time seat status updates for a specific event/stadium.
    Clients should reconnect if the socket drops.
    """
    await seats_ws_manager.connect(event_id, ws)
    try:
        while True:
            # Keep the connection alive; clients don't need to send messages.
            await ws.receive_text()
    except WebSocketDisconnect:
        return
    finally:
        await seats_ws_manager.disconnect(event_id, ws)

