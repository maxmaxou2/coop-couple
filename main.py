from enum import Enum
from typing import Dict, Optional, Any, List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
import os
import json
import random
import asyncio
import time

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
MODEL_NAME = "gpt-4o-mini"

class Phase(str, Enum):
    LOBBY = "lobby"
    ZAMOURS = "zamours"
    TELEPATHIC_GAUGE = "telepathic_gauge"
    TIMES_UP = "times_up"

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

    async def generate_times_up_words(self, count: int):
        prompt = f"Génère une liste de {count} mots ou expressions variées (objets, célébrités, actions, lieux) pour un jeu type Time's Up. Renvoie un objet JSON : {{\"words\": [\"...\", \"...\"]}}"
        try:
            response = client.chat.completions.create(
                model=MODEL_NAME,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            data = json.loads(response.choices[0].message.content)
            if "words" in data and isinstance(data["words"], list):
                return data["words"]
            return list(data.values()) if isinstance(data, dict) else [str(data)]
        except Exception:
            return ["Pomme", "Tour Eiffel", "Courir", "Zinedine Zidane"] * (count // 4 + 1)

    async def generate_zamours_questions(self, count: int):
        prompt = f"Génère {count} questions personnelles pour un jeu de couple type Les Z'amours avec le placeholder '{{name}}'. Renvoie un objet JSON : {{\"questions\": [\"...\", \"...\"]}}"
        try:
            response = client.chat.completions.create(
                model=MODEL_NAME,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            data = json.loads(response.choices[0].message.content)
            if "questions" in data and isinstance(data["questions"], list):
                return data["questions"]
            return list(data.values()) if isinstance(data, dict) else [str(data)]
        except Exception:
            return ["Quel est le plat préféré de {name} ?"] * count

    async def generate_telepathic_themes(self, count: int):
        prompt = f"Génère {count} thèmes abstraits pour un jeu de jauge (échelle 0 à 100). Renvoie un objet JSON : {{\"themes\": [\"...\", \"...\"]}}"
        try:
            response = client.chat.completions.create(
                model=MODEL_NAME,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            data = json.loads(response.choices[0].message.content)
            if "themes" in data and isinstance(data["themes"], list):
                return data["themes"]
            return list(data.values()) if isinstance(data, dict) else [str(data)]
        except Exception:
            return ["Intensité", "Danger", "Prix"] * count

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

    def get_structured_question(self, index: int, questions: List[str]):
        template = questions[index % len(questions)]
        p_key = "player1" if index < (len(questions) // 2) else "player2"
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

        elif action == "start_zamours" and role == "host":
            count = payload.get("count", 10)
            self.state.game_data["loading"] = True
            await self.broadcast_state()
            questions = await self.generate_zamours_questions(count)
            self.state.current_phase = Phase.ZAMOURS
            self.state.game_data = {
                "question_index": 0,
                "answers": {},
                "revealed": False,
                "question": self.get_structured_question(0, questions),
                "total_questions": len(questions),
                "all_questions": questions,
                "loading": False
            }
        
        elif action == "submit_answer":
            answers = self.state.game_data.get("answers", {})
            answers[role] = payload.get("answer")
            self.state.game_data["answers"] = answers
            if "player1" in answers and "player2" in answers:
                self.state.game_data["revealed"] = True
                
        elif action == "next_question":
            idx = self.state.game_data.get("question_index", 0) + 1
            questions = self.state.game_data.get("all_questions", [])
            if idx < len(questions):
                self.state.game_data = {
                    "question_index": idx,
                    "answers": {},
                    "revealed": False,
                    "question": self.get_structured_question(idx, questions),
                    "total_questions": len(questions),
                    "all_questions": questions
                }
            else:
                self.state.current_phase = Phase.LOBBY
                self.state.game_data = {}

        elif action == "start_telepathic" and role == "host":
            count = payload.get("count", 5)
            self.state.game_data["loading"] = True
            await self.broadcast_state()
            themes = await self.generate_telepathic_themes(count)
            self.state.current_phase = Phase.TELEPATHIC_GAUGE
            self.setup_gauge_round(0, themes)
            self.state.game_data["loading"] = False

        elif action == "clue_given" and role == self.state.game_data.get("indicator_id"):
            self.state.game_data["step"] = "waiting_guess"

        elif action == "submit_guess" and role == self.state.game_data.get("guesser_id"):
            self.state.game_data["guess"] = payload.get("guess")
            self.state.game_data["step"] = "reveal"

        elif action == "next_gauge_round" and role == "host":
            idx = self.state.game_data.get("round_index", 0) + 1
            themes = self.state.game_data.get("all_themes", [])
            if idx < len(themes):
                self.setup_gauge_round(idx, themes)
            else:
                self.state.current_phase = Phase.LOBBY
                self.state.game_data = {}

        elif action == "start_times_up" and role == "host":
            count = payload.get("count", 15)
            self.state.game_data["loading"] = True
            await self.broadcast_state()
            words = await self.generate_times_up_words(count)
            self.state.current_phase = Phase.TIMES_UP
            self.state.game_data = {
                "initial_words": words,
                "current_words": list(words),
                "round": 1,
                "speaker_id": "player1",
                "timer_end": 0,
                "timer_running": False,
                "loading": False,
                "current_word": None
            }
            random.shuffle(self.state.game_data["current_words"])

        elif action == "start_turn" and role == "host":
            self.state.game_data["timer_end"] = int(time.time() * 1000) + 45000
            self.state.game_data["timer_running"] = True
            self.state.game_data["current_word"] = self.state.game_data["current_words"][0]
            
        elif action == "word_guessed" and role == self.state.game_data.get("speaker_id"):
            words = self.state.game_data.get("current_words", [])
            if words:
                words.pop(0)
                if not words:
                    self.state.game_data["timer_running"] = False
                    self.state.game_data["current_word"] = None
                else:
                    self.state.game_data["current_word"] = words[0]
            
        elif action == "end_turn" and role == "host":
            self.state.game_data["timer_running"] = False
            self.state.game_data["timer_end"] = 0
            self.state.game_data["current_word"] = None
            self.state.game_data["speaker_id"] = "player2" if self.state.game_data["speaker_id"] == "player1" else "player1"

        elif action == "next_round" and role == "host":
            current_round = self.state.game_data.get("round", 1)
            if current_round < 3:
                self.state.game_data["round"] = current_round + 1
                self.state.game_data["current_words"] = list(self.state.game_data["initial_words"])
                random.shuffle(self.state.game_data["current_words"])
                self.state.game_data["current_word"] = None
                self.state.game_data["timer_running"] = False
            else:
                self.state.current_phase = Phase.LOBBY
                self.state.game_data = {}
        
        await self.broadcast_state()

    def setup_gauge_round(self, index: int, themes: List[str]):
        indicator_id = "player1" if index % 2 == 0 else "player2"
        guesser_id = "player2" if index % 2 == 0 else "player1"
        self.state.game_data = {
            "round_index": index,
            "theme": themes[index % len(themes)],
            "target": random.randint(5, 95),
            "indicator_id": indicator_id,
            "guesser_id": guesser_id,
            "guess": None,
            "step": "waiting_clue",
            "all_themes": themes,
            "total_rounds": len(themes)
        }

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
