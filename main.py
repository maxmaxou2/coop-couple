from enum import Enum
from typing import Dict, Optional, Any
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Phase(str, Enum):
    LOBBY = "lobby"
    ZAMOURS = "zamours"

QUESTIONS = [
    "Quel est son plat préféré ?",
    "Quelle est sa plus grande peur ?",
    "Où s'est déroulé votre premier rendez-vous ?",
    "Quel est son plus gros défaut ?"
]

class Player(BaseModel):
    id: str
    name: Optional[str] = None
    connected: bool = True

class GameState(BaseModel):
    current_phase: Phase = Phase.LOBBY
    players: Dict[str, Player] = {}
    game_data: Dict[str, Any] = {}

class GameServer:
    def __init__(self):
        self.state = GameState()
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, role: str):
        await websocket.accept()
        self.active_connections[role] = websocket
        if role != "host":
            self.state.players[role] = Player(id=role)
        await self.broadcast_state()

    def disconnect(self, role: str):
        if role in self.active_connections:
            del self.active_connections[role]
        if role != "host" and role in self.state.players:
            self.state.players[role].connected = False

    async def broadcast_state(self):
        message = {
            "action": "state_update",
            "payload": self.state.model_dump()
        }
        for role, connection in list(self.active_connections.items()):
            try:
                await connection.send_json(message)
            except:
                self.disconnect(role)

    async def handle_action(self, role: str, action: str, payload: Dict[str, Any]):
        if action == "start_zamours":
            self.state.current_phase = Phase.ZAMOURS
            self.state.game_data = {
                "question_index": 0,
                "answers": {},
                "revealed": False,
                "question": QUESTIONS[0]
            }
        elif action == "submit_answer" and role != "host":
            answers = self.state.game_data.get("answers", {})
            answers[role] = payload.get("answer")
            self.state.game_data["answers"] = answers
            if "player1" in answers and "player2" in answers:
                self.state.game_data["revealed"] = True
        elif action == "next_question":
            idx = self.state.game_data.get("question_index", 0) + 1
            if idx < len(QUESTIONS):
                self.state.game_data = {
                    "question_index": idx,
                    "answers": {},
                    "revealed": False,
                    "question": QUESTIONS[idx]
                }
            else:
                self.state.current_phase = Phase.LOBBY
                self.state.game_data = {}
        await self.broadcast_state()

server = GameServer()

@app.websocket("/ws/{role}")
async def websocket_endpoint(websocket: WebSocket, role: str):
    if role not in ["host", "player1", "player2"]:
        await websocket.close(code=1008)
        return
    await server.connect(websocket, role)
    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            await server.handle_action(role, msg.get("action"), msg.get("payload", {}))
    except (WebSocketDisconnect, json.JSONDecodeError):
        server.disconnect(role)
        await server.broadcast_state()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
