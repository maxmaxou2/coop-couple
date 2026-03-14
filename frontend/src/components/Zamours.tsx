"use client";
import React, { useState } from "react";
import { GameState } from "@/hooks/useGameSocket";

interface Props {
  gameState: GameState;
  role: string;
  sendAction: (action: string, payload?: any) => void;
}

const ScoreControls = ({ playerId, sendAction }: { playerId: string, sendAction: (a: string, p: any) => void }) => (
  <div className="flex gap-2 mt-4">
    <button onClick={() => sendAction("update_score", { player_id: playerId, delta: 1 })} className="bg-white/20 hover:bg-white/40 px-3 py-1 rounded-lg text-xs font-bold">+1</button>
    <button onClick={() => sendAction("update_score", { player_id: playerId, delta: 0.5 })} className="bg-white/20 hover:bg-white/40 px-3 py-1 rounded-lg text-xs font-bold">+0.5</button>
    <button onClick={() => sendAction("update_score", { player_id: playerId, delta: -0.5 })} className="bg-white/20 hover:bg-white/40 px-3 py-1 rounded-lg text-xs font-bold">-0.5</button>
    <button onClick={() => sendAction("update_score", { player_id: playerId, delta: -1 })} className="bg-white/20 hover:bg-white/40 px-3 py-1 rounded-lg text-xs font-bold">-1</button>
  </div>
);

export const ZamoursHost = ({ gameState, sendAction }: Props) => {
  const { question, answers, revealed, question_index, total_questions } = gameState.game_data;
  const p1 = gameState.players.player1;
  const p2 = gameState.players.player2;
  const p1Answered = !!answers?.player1;
  const p2Answered = !!answers?.player2;

  const progress = ((question_index + 1) / total_questions) * 100;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-purple-950 text-white text-center">
      {/* Top Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-2 bg-white/10">
        <div 
          className="h-full bg-yellow-400 transition-all duration-1000 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header Info */}
      <div className="fixed top-8 left-8 right-8 flex justify-between items-start pointer-events-none">
        <div className="flex flex-col items-start bg-blue-600/30 p-6 rounded-3xl border border-blue-500/50 pointer-events-auto">
          <span className="text-xs uppercase tracking-widest opacity-60 mb-1">{p1?.name}</span>
          <span className="text-4xl font-black">{p1?.score.toFixed(1)} <span className="text-sm opacity-50">PTS</span></span>
          <ScoreControls playerId="player1" sendAction={sendAction} />
        </div>

        <div className="bg-white/10 px-8 py-3 rounded-full font-black italic tracking-tighter text-xl backdrop-blur-md">
          {question_index + 1} / {total_questions}
        </div>

        <div className="flex flex-col items-end bg-pink-600/30 p-6 rounded-3xl border border-pink-500/50 pointer-events-auto">
          <span className="text-xs uppercase tracking-widest opacity-60 mb-1">{p2?.name}</span>
          <span className="text-4xl font-black">{p2?.score.toFixed(1)} <span className="text-sm opacity-50">PTS</span></span>
          <ScoreControls playerId="player2" sendAction={sendAction} />
        </div>
      </div>

      {/* Question */}
      <h2 className="text-2xl opacity-40 mb-4 font-mono uppercase tracking-[0.3em]">Question</h2>
      <h1 className="text-6xl font-black mb-20 max-w-5xl leading-tight drop-shadow-2xl">{question}</h1>

      <div className="grid grid-cols-2 gap-16 w-full max-w-5xl mb-16">
        <div className={`p-10 rounded-[2.5rem] transition-all duration-700 ${p1Answered ? "bg-blue-600 scale-105 shadow-[0_0_50px_rgba(37,99,235,0.4)]" : "bg-white/5 opacity-30"}`}>
          <p className="text-2xl font-bold mb-6 opacity-80 uppercase tracking-tighter">{p1?.name}</p>
          {revealed ? (
            <p className="text-4xl font-black italic">"{answers.player1}"</p>
          ) : (
            <p className="text-xl animate-pulse font-medium">{p1Answered ? "PRÊT !" : "RÉFLÉCHIT..."}</p>
          )}
        </div>
        <div className={`p-10 rounded-[2.5rem] transition-all duration-700 ${p2Answered ? "bg-pink-600 scale-105 shadow-[0_0_50px_rgba(219,39,119,0.4)]" : "bg-white/5 opacity-30"}`}>
          <p className="text-2xl font-bold mb-6 opacity-80 uppercase tracking-tighter">{p2?.name}</p>
          {revealed ? (
            <p className="text-4xl font-black italic">"{answers.player2}"</p>
          ) : (
            <p className="text-xl animate-pulse font-medium">{p2Answered ? "PRÊT !" : "RÉFLÉCHIT..."}</p>
          )}
        </div>
      </div>

      {revealed && (
        <button
          onClick={() => sendAction("next_question")}
          className="px-16 py-8 bg-white text-purple-900 rounded-[2rem] font-black text-3xl hover:scale-105 transition-transform shadow-2xl active:scale-95"
        >
          QUESTION SUIVANTE
        </button>
      )}
    </div>
  );
};

export const ZamoursPlayer = ({ gameState, role, sendAction }: Props) => {
  const [input, setInput] = useState("");
  const { question, answers } = gameState.game_data;
  const hasAnswered = !!answers?.[role];

  if (hasAnswered) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-900 text-white text-center">
        <div className="w-24 h-24 border-8 border-t-white border-white/10 rounded-full animate-spin mb-10" />
        <h1 className="text-4xl font-black uppercase tracking-tighter italic">C'est envoyé !</h1>
        <p className="mt-4 text-xl opacity-40">Attends que l'autre termine...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-purple-900 text-white">
      <div className="w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-10 leading-snug">{question}</h2>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ta réponse..."
          className="w-full p-6 bg-white/10 border-4 border-white/10 rounded-[2rem] text-2xl mb-6 focus:border-white outline-none transition-all placeholder:opacity-30"
        />
        <button
          onClick={() => sendAction("submit_answer", { answer: input })}
          disabled={!input.trim()}
          className="w-full p-6 bg-white text-purple-900 rounded-[2rem] font-black text-2xl disabled:opacity-30 active:scale-95 transition-transform"
        >
          VALIDER
        </button>
      </div>
    </div>
  );
};
