"use client";
import React, { useState } from "react";
import { GameState } from "@/hooks/useGameSocket";

interface Props {
  gameState: GameState;
  role: string;
  sendAction: (action: string, payload?: any) => void;
}

export const ZamoursHost = ({ gameState, sendAction }: Props) => {
  const { question, answers, revealed } = gameState.game_data;
  const p1Answered = !!answers?.player1;
  const p2Answered = !!answers?.player2;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-purple-950 text-white text-center">
      <h2 className="text-2xl opacity-70 mb-2 font-mono uppercase tracking-widest">Question</h2>
      <h1 className="text-5xl font-black mb-16 max-w-3xl leading-tight">{question}</h1>

      <div className="grid grid-cols-2 gap-12 w-full max-w-4xl mb-12">
        <div className={`p-8 rounded-3xl transition-all duration-500 ${p1Answered ? "bg-blue-600 scale-105" : "bg-white/5"}`}>
          <p className="text-xl font-bold mb-4">Player 1</p>
          {revealed ? (
            <p className="text-3xl font-black italic">"{answers.player1}"</p>
          ) : (
            <p className="animate-pulse">{p1Answered ? "Réponse reçue !" : "En attente..."}</p>
          )}
        </div>
        <div className={`p-8 rounded-3xl transition-all duration-500 ${p2Answered ? "bg-pink-600 scale-105" : "bg-white/5"}`}>
          <p className="text-xl font-bold mb-4">Player 2</p>
          {revealed ? (
            <p className="text-3xl font-black italic">"{answers.player2}"</p>
          ) : (
            <p className="animate-pulse">{p2Answered ? "Réponse reçue !" : "En attente..."}</p>
          )}
        </div>
      </div>

      {revealed && (
        <button
          onClick={() => sendAction("next_question")}
          className="px-12 py-6 bg-white text-purple-900 rounded-2xl font-black text-2xl hover:bg-gray-200 transition-transform active:scale-95"
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
        <div className="w-20 h-20 border-4 border-t-white border-white/20 rounded-full animate-spin mb-8" />
        <h1 className="text-3xl font-bold">Réponse envoyée !</h1>
        <p className="mt-4 opacity-60">Regarde l'écran principal...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-purple-900 text-white">
      <h2 className="text-xl font-bold mb-8 text-center">{question}</h2>
      <div className="w-full max-w-md">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ta réponse..."
          className="w-full p-5 bg-white/10 border-2 border-white/20 rounded-2xl text-xl mb-4 focus:border-white outline-none"
        />
        <button
          onClick={() => sendAction("submit_answer", { answer: input })}
          disabled={!input.trim()}
          className="w-full p-5 bg-white text-purple-900 rounded-2xl font-black text-xl disabled:opacity-50"
        >
          VALIDER
        </button>
      </div>
    </div>
  );
};
