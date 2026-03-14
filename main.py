from enum import Enum
from typing import Dict, Optional, Any
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import random

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

QUESTION_TEMPLATES = [
    "Quel est le plat préféré de {name} ?",
    "Quelle est la plus grande peur de {name} ?",
    "Quel est le plus gros défaut de {name} ?",
    "Quelle est la plus grande qualité de {name} ?",
    "Quelle est la destination de rêve de {name} ?",
    "Quel est le film préféré de {name} ?",
    "Quelle est la chanson honteuse de {name} ?",
    "Quel était le premier job de {name} ?",
    "Quel est le talent caché de {name} ?",
    "Quelle est la plus grosse bêtise d'enfance de {name} ?",
    "Quel est l'animal de compagnie idéal pour {name} ?",
    "Quel super-pouvoir {name} aimerait-il avoir ?",
    "Quelle est la chose la plus agaçante chez {name} ?",
    "Quel est le plus beau souvenir de {name} avec toi ?",
    "Quel objet {name} emporterait sur une île déserte ?",
    "Quel est l'acteur ou l'actrice préféré(e) de {name} ?",
    "Quel sport {name} déteste-t-il pratiquer ?",
    "Quelle est la série préférée de {name} en ce moment ?",
    "Quel est le petit déjeuner idéal pour {name} ?",
    "Quelle est la plus grande fierté de {name} ?"
]

class Player(BaseModel):
    id: str
    name: str = "Joueur"
    connected: bool = True
    score: float = 0.0

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
        if role != "host" and role not in self.state.players:
            self.state.players[role] = Player(id=role)
        elif role in self.state.players:
            self.state.players[role].connected = True
        await self.broadcast_state()

    def disconnect(self, role: str):
        if role in self.active_connections:
            del self.active_connections[role]
        if role != "host" and role in self.state.players:
            self.state.players[role].connected = False

    async def broadcast_state(self):
        message = {"action": "state_update", "payload": self.state.model_dump()}
        for role, connection in list(self.active_connections.items()):
            try:
                await connection.send_json(message)
            except:
                self.disconnect(role)

    def get_structured_question(self, index: int):
        template = QUESTION_TEMPLATES[index % len(QUESTION_TEMPLATES)]
        p_key = "player1" if index < len(QUESTION_TEMPLATES)//2 else "player2"
        player = self.state.players.get(p_key)
        target_name = player.name if player else "???"
        return template.format(name=target_name)

    async def handle_action(self, role: str, action: str, payload: Dict[str, Any]):
        if action == "set_name" and role in self.state.players:
            self.state.players[role].name = payload.get("name", "Joueur")
        
        elif action == "update_score" and role == "host":
            p_id = payload.get("player_id")
            delta = payload.get("delta", 0)
            if p_id in self.state.players:
                self.state.players[p_id].score = max(0, self.state.players[p_id].score + delta)

        elif action == "start_zamours":
            self.state.current_phase = Phase.ZAMOURS
            self.state.game_data = {
                "question_index": 0,
                "answers": {},
                "revealed": False,
                "question": self.get_structured_question(0),
                "total_questions": len(QUESTION_TEMPLATES)
            }
        
        elif action == "submit_answer":
            answers = self.state.game_data.get("answers", {})
            answers[role] = payload.get("answer")
            self.state.game_data["answers"] = answers
            if "player1" in answers and "player2" in answers:
                self.state.game_data["revealed"] = True
                
        elif action == "next_question":
            idx = self.state.game_data.get("question_index", 0) + 1
            if idx < len(QUESTION_TEMPLATES):
                self.state.game_data = {
                    "question_index": idx,
                    "answers": {},
                    "revealed": False,
                    "question": self.get_structured_question(idx),
                    "total_questions": len(QUESTION_TEMPLATES)
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
