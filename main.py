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
MODEL_NAME = "gpt-4o"

class Phase(str, Enum):
    LOBBY = "lobby"
    ZAMOURS = "zamours"
    TELEPATHIC_GAUGE = "telepathic_gauge"
    TIMES_UP = "times_up"
    BLIND_DRAWING = "blind_drawing"

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

    async def generate_ai_content(self, prompt: str, key: str):
        try:
            response = client.chat.completions.create(
                model=MODEL_NAME,
                messages=[
                    {"role": "system", "content": "Tu es un assistant de jeu créatif et imprévisible. Tes thèmes et mots doivent être originaux, sans trop être absurdes, et ne jamais se répéter. Réponds toujours avec un objet JSON contenant une LISTE DE CHAINES DE CARACTERES (strings) uniquement. Pas d'objets imbriqués."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=1
            )
            data = json.loads(response.choices[0].message.content)
            raw_list = data.get(key, list(data.values())[0])
            
            processed_list = []
            for item in raw_list:
                if isinstance(item, dict):
                    processed_list.append(item.get("name", item.get("label", str(item))))
                else:
                    processed_list.append(str(item))
            return processed_list
        except Exception:
            return []

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

    def get_alternating_question(self, index: int, questions: List[str]):
        template = questions[index % len(questions)]
        p_key = "player1" if index % 2 == 0 else "player2"
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
            prompt = f"Génère {count} questions de couple insolites, drôles ou profondes dont les réponses sont courtes pour tester les connaissances de l'autre personne sur le placeholder '{{name}}'. Évite les questions trop longues. JSON: {{\"questions\": []}}"
            questions = await self.generate_ai_content(prompt, "questions")
            self.state.current_phase = Phase.ZAMOURS
            self.state.game_data = {
                "question_index": 0, "answers": {}, "revealed": False,
                "question": self.get_alternating_question(0, questions),
                "total_questions": len(questions), "all_questions": questions, "loading": False
            }

        elif action == "next_question":
            idx = self.state.game_data.get("question_index", 0) + 1
            questions = self.state.game_data.get("all_questions", [])
            if idx < len(questions):
                self.state.game_data.update({
                    "question_index": idx, "answers": {}, "revealed": False,
                    "question": self.get_alternating_question(idx, questions)
                })
            else:
                self.state.current_phase = Phase.LOBBY
                self.state.game_data = {}

        elif action == "start_telepathic" and role == "host":
            count = payload.get("count", 5)
            self.state.game_data["loading"] = True
            await self.broadcast_state()
            prompt = f"Génère {count} thèmes créatifs et clivants mais très courts pour un jeu d'échelle (0 à 100). Ex: 'Musique parfaite pour un enterrement', 'Une action qui brûle la planète'. JSON: {{\"themes\": []}}"
            themes = await self.generate_ai_content(prompt, "themes")
            self.state.current_phase = Phase.TELEPATHIC_GAUGE
            self.setup_gauge_round(0, themes)
            self.state.game_data["loading"] = False

        elif action == "update_guess" and role == self.state.game_data.get("guesser_id"):
            self.state.game_data["guess"] = payload.get("guess")

        elif action == "submit_guess" and role == self.state.game_data.get("guesser_id"):
            self.state.game_data["step"] = "reveal"

        elif action == "start_times_up" and role == "host":
            count = payload.get("count", 15)
            self.state.game_data["loading"] = True
            await self.broadcast_state()
            prompt = f"Génère {count} mots très variés pour Time's Up mais de la langue française courante. Un seul mot à faire deviner à chaque fois. Choisis des objets, célébrités, actions, lieux. JSON: {{\"words\": []}}"
            words = await self.generate_ai_content(prompt, "words")
            self.state.current_phase = Phase.TIMES_UP
            self.state.game_data = {
                "initial_words": words, "current_words": list(words), "round": 1,
                "speaker_id": "player1", "timer_end": 0, "timer_running": False,
                "loading": False, "current_word": None
            }
            random.shuffle(self.state.game_data["current_words"])

        elif action == "start_turn" and role == "host":
            self.state.game_data["timer_end"] = int(time.time() * 1000) + 45000
            self.state.game_data["timer_running"] = True
            random.shuffle(self.state.game_data["current_words"])
            self.state.game_data["current_word"] = self.state.game_data["current_words"][0]

        elif action == "word_guessed" and role == self.state.game_data.get("speaker_id"):
            if self.state.game_data.get("timer_running") and int(time.time() * 1000) < self.state.game_data["timer_end"]:
                words = self.state.game_data.get("current_words", [])
                if words:
                    words.pop(0)
                    if not words:
                        self.state.game_data["timer_running"] = False
                        self.state.game_data["current_word"] = None
                    else:
                        self.state.game_data["current_word"] = words[0]

        elif action == "skip_word" and role == self.state.game_data.get("speaker_id"):
            words = self.state.game_data.get("current_words", [])
            if len(words) > 1:
                words.append(words.pop(0))
                self.state.game_data["current_word"] = words[0]

        elif action == "end_turn" and role == "host":
            self.state.game_data["timer_running"] = False
            self.state.game_data["current_word"] = None
            random.shuffle(self.state.game_data["current_words"])
            self.state.game_data["speaker_id"] = "player2" if self.state.game_data["speaker_id"] == "player1" else "player1"

        elif action == "start_blind_drawing" and role == "host":
            count = payload.get("count", 4)
            self.state.current_phase = Phase.BLIND_DRAWING
            self.setup_drawing_round(0, count)

        elif action == "submit_drawing" and role == self.state.game_data.get("drawer_id"):
            self.state.game_data["drawing_base64"] = payload.get("drawing")
            self.state.game_data["step"] = "reveal"

        elif action == "submit_answer":
            answers = self.state.game_data.get("answers", {})
            answers[role] = payload.get("answer")
            self.state.game_data["answers"] = answers
            if "player1" in answers and "player2" in answers:
                self.state.game_data["revealed"] = True

        elif action == "clue_given":
            self.state.game_data["step"] = "waiting_guess"
        
        elif action == "return_to_lobby" and role == "host":
            self.state.current_phase = Phase.LOBBY
            self.state.game_data = {}

        elif action.startswith("next_"):
            if self.state.current_phase == Phase.TELEPATHIC_GAUGE:
                idx = self.state.game_data.get("round_index", 0) + 1
                themes = self.state.game_data.get("all_themes", [])
                if idx < len(themes): self.setup_gauge_round(idx, themes)
                else: self.state.current_phase = Phase.LOBBY
            elif self.state.current_phase == Phase.BLIND_DRAWING:
                idx = self.state.game_data.get("round_index", 0) + 1
                total = self.state.game_data.get("total_rounds", 4)
                if idx < total: self.setup_drawing_round(idx, total)
                else: self.state.current_phase = Phase.LOBBY
            elif self.state.current_phase == Phase.TIMES_UP:
                current_round = self.state.game_data.get("round", 1)
                if current_round < 3:
                    self.state.game_data.update({"round": current_round + 1, "current_words": list(self.state.game_data["initial_words"]), "current_word": None, "timer_running": False})
                    random.shuffle(self.state.game_data["current_words"])
                else: self.state.current_phase = Phase.LOBBY
        
        await self.broadcast_state()

    def setup_gauge_round(self, index: int, themes: List[str]):
        self.state.game_data = {
            "round_index": index, "theme": themes[index % len(themes)], "target": random.randint(5, 95),
            "indicator_id": "player1" if index % 2 == 0 else "player2",
            "guesser_id": "player2" if index % 2 == 0 else "player1",
            "guess": 50, "step": "waiting_clue", "all_themes": themes, "total_rounds": len(themes)
        }

    def setup_drawing_round(self, index: int, total: int):
        self.state.game_data = {
            "round_index": index, "total_rounds": total, "target_image": f"https://picsum.photos/seed/{random.randint(1,9999)}/400/300",
            "guide_id": "player1" if index % 2 == 0 else "player2",
            "drawer_id": "player2" if index % 2 == 0 else "player1",
            "drawing_base64": None, "step": "waiting_draw"
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
