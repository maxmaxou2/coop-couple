"use client";
import React, { useState } from "react";
import { GameState } from "@/hooks/useGameSocket";

interface PhaseProps {
  gameState: GameState;
  role: string;
  sendAction: (action: string, payload?: any) => void;
}

export const Lobby = ({ gameState, role, sendAction }: PhaseProps) => {
  const isHost = role === "host";
  const players = Object.values(gameState.players);
  const [zamoursCount, setZamoursCount] = useState(10);
  const [telepathicCount, setTelepathicCount] = useState(5);

  if (gameState.game_data.loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-900 text-white text-center">
        <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden mb-8">
          <div className="h-full bg-yellow-400 animate-[loading_2s_ease-in-out_infinite]" style={{ width: "30%" }} />
        </div>
        <h1 className="text-2xl font-black animate-pulse uppercase tracking-widest">Génération par l'IA...</h1>
        <p className="mt-4 opacity-50 italic">Le modèle prépare vos questions personnalisées</p>
        <style jsx>{`
          @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(400%); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-900 text-white text-center">
      <h1 className="text-4xl font-bold mb-8 italic">LOBBY</h1>
      
      <div className="mb-12">
        <h2 className="text-sm opacity-50 uppercase tracking-[0.2em] mb-4">Joueurs</h2>
        <ul className="space-y-4">
          {players.map((p) => (
            <li key={p.id} className={`text-2xl font-bold flex items-center justify-center gap-4 ${p.connected ? "text-white" : "text-red-500 opacity-50"}`}>
              <div className={`w-4 h-4 rounded-full ${p.id === "player1" ? "bg-blue-500" : "bg-pink-500"}`} />
              {p.name} {p.connected ? "" : "(Déconnecté)"}
            </li>
          ))}
          {players.length === 0 && <p className="text-gray-500 italic">En attente de joueurs...</p>}
        </ul>
      </div>

      {isHost && players.length > 0 && (
        <div className="flex flex-col gap-8 w-full max-w-sm">
          <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
            <p className="text-xs font-bold mb-4 opacity-50 uppercase tracking-widest">Les Z'amours</p>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xl font-black">{zamoursCount} Questions</span>
              <input 
                type="range" min="5" max="30" step="1" 
                value={zamoursCount} onChange={(e) => setZamoursCount(parseInt(e.target.value))}
                className="w-1/2 accent-blue-600"
              />
            </div>
            <button
              onClick={() => sendAction("start_zamours", { count: zamoursCount })}
              className="w-full py-4 bg-blue-600 rounded-xl font-bold hover:bg-blue-500 transition-colors"
            >
              LANCER
            </button>
          </div>

          <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
            <p className="text-xs font-bold mb-4 opacity-50 uppercase tracking-widest">Jauge Télépathique</p>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xl font-black">{telepathicCount} Manches</span>
              <input 
                type="range" min="2" max="20" step="1" 
                value={telepathicCount} onChange={(e) => setTelepathicCount(parseInt(e.target.value))}
                className="w-1/2 accent-cyan-600"
              />
            </div>
            <button
              onClick={() => sendAction("start_telepathic", { count: telepathicCount })}
              className="w-full py-4 bg-cyan-600 rounded-xl font-bold hover:bg-cyan-500 transition-colors"
            >
              LANCER
            </button>
          </div>
        </div>
      )}
      {!isHost && <p className="animate-pulse opacity-50 italic">En attente du host...</p>}
    </div>
  );
};

export const Game1 = () => null; // Obsolete
