"use client";
import React, { useState } from "react";
import { GameState } from "@/hooks/useGameSocket";

interface Props {
  gameState: GameState;
  role: string;
  sendAction: (action: string, payload?: any) => void;
}

export const TelepathicHost = ({ gameState, sendAction }: Props) => {
  const { theme, target, guess, step, indicator_id, guesser_id } = gameState.game_data;
  const indicator = gameState.players[indicator_id];
  const guesser = gameState.players[guesser_id];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-slate-950 text-white text-center">
      <h2 className="text-3xl opacity-50 mb-4 font-mono uppercase tracking-[0.4em]">Thème</h2>
      <h1 className="text-7xl font-black mb-20 text-cyan-400 drop-shadow-[0_0_30px_rgba(34,211,238,0.4)]">{theme}</h1>

      <div className="w-full max-w-5xl h-32 bg-white/5 rounded-full relative overflow-hidden border-4 border-white/10 mb-20 shadow-[inset_0_2px_20px_rgba(0,0,0,0.5)]">
        {step === "reveal" && (
          <>
            {/* Zone Cible Élargie (Marge d'erreur visuelle) */}
            <div 
              className="absolute top-0 bottom-0 bg-cyan-500/40 border-x-2 border-cyan-400 z-10 transition-all duration-1000 shadow-[0_0_30px_rgba(34,211,238,0.2)]"
              style={{ left: `${target - 5}%`, width: "10%" }}
            />
            {/* Cible Exacte */}
            <div 
              className="absolute top-0 bottom-0 w-1 bg-cyan-300 z-20 opacity-50"
              style={{ left: `${target}%` }}
            />
            {/* Estimation du Joueur */}
            <div 
              className="absolute top-0 bottom-0 w-2 bg-yellow-400 z-30 shadow-[0_0_25px_rgba(250,204,21,1)] transition-all duration-1000"
              style={{ left: `${guess}%` }}
            />
          </>
        )}
      </div>

      <div className="flex gap-20 items-center">
        <div className={`p-8 rounded-3xl transition-all ${step === "waiting_clue" ? "bg-cyan-600 scale-110" : "bg-white/5 opacity-40"}`}>
          <p className="text-sm uppercase mb-2">Indicateur</p>
          <p className="text-3xl font-bold">{indicator?.name}</p>
        </div>
        <div className={`p-8 rounded-3xl transition-all ${step === "waiting_guess" ? "bg-yellow-600 scale-110" : "bg-white/5 opacity-40"}`}>
          <p className="text-sm uppercase mb-2">Devineur</p>
          <p className="text-3xl font-bold">{guesser?.name}</p>
        </div>
      </div>

      {step === "reveal" && (
        <button
          onClick={() => sendAction("next_gauge_round")}
          className="mt-20 px-12 py-6 bg-white text-slate-950 rounded-2xl font-black text-2xl hover:scale-105 transition-transform"
        >
          MANCHE SUIVANTE
        </button>
      )}
    </div>
  );
};

export const TelepathicPlayer = ({ gameState, role, sendAction }: Props) => {
  const [localGuess, setLocalGuess] = useState(50);
  const { theme, target, step, indicator_id, guesser_id } = gameState.game_data;
  
  if (role === indicator_id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-cyan-950 text-white text-center">
        <h2 className="text-xl opacity-60 mb-2 uppercase">Ton rôle : Indicateur</h2>
        <h1 className="text-4xl font-black mb-10">{theme}</h1>
        
        <div className="w-full h-24 bg-white/5 rounded-2xl relative mb-12 flex items-center justify-center border-2 border-white/10">
          <p className="text-5xl font-black text-cyan-400">CIBLE : {target}</p>
          <div className="absolute bottom-0 left-0 h-2 bg-cyan-400 transition-all" style={{ width: `${target}%` }} />
        </div>

        {step === "waiting_clue" ? (
          <button
            onClick={() => sendAction("clue_given")}
            className="w-full max-w-xs p-6 bg-white text-cyan-950 rounded-2xl font-black text-xl"
          >
            INDICE DONNÉ
          </button>
        ) : (
          <p className="animate-pulse italic opacity-60 text-xl">L'autre joueur devine...</p>
        )}
      </div>
    );
  }

  if (role === guesser_id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-slate-900 text-white text-center">
        <h2 className="text-xl opacity-60 mb-2 uppercase">Ton rôle : Devineur</h2>
        <h1 className="text-4xl font-black mb-10">{theme}</h1>

        {step === "waiting_clue" ? (
          <p className="animate-pulse italic opacity-60 text-xl">L'autre joueur prépare son indice...</p>
        ) : step === "waiting_guess" ? (
          <div className="w-full max-w-md">
            <input
              type="range"
              min="0"
              max="100"
              value={localGuess}
              onChange={(e) => setLocalGuess(parseInt(e.target.value))}
              className="w-full h-12 bg-white/10 rounded-full appearance-none cursor-pointer accent-yellow-400 mb-10"
            />
            <p className="text-6xl font-black mb-10 text-yellow-400">{localGuess}</p>
            <button
              onClick={() => sendAction("submit_guess", { guess: localGuess })}
              className="w-full p-6 bg-yellow-400 text-slate-950 rounded-2xl font-black text-xl"
            >
              VALIDER L'ESTIMATION
            </button>
          </div>
        ) : (
          <p className="italic opacity-60 text-xl font-mono uppercase tracking-widest">Révélation en cours...</p>
        )}
      </div>
    );
  }

  return <div className="p-10 text-white">Observateur...</div>;
};
