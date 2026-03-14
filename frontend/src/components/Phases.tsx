"use client";
import React from "react";
import { GameState } from "@/hooks/useGameSocket";

interface PhaseProps {
  gameState: GameState;
  role: string;
  sendAction: (action: string, payload?: any) => void;
}

export const Lobby = ({ gameState, role, sendAction }: PhaseProps) => {
  const isHost = role === "host";
  const players = Object.values(gameState.players);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-900 text-white text-center">
      <h1 className="text-4xl font-bold mb-8">Lobby</h1>
      <div className="mb-8">
        <h2 className="text-xl mb-4">Players Joined:</h2>
        <ul className="space-y-2">
          {players.map((p) => (
            <li key={p.id} className={`${p.connected ? "text-green-400" : "text-red-400"}`}>
              {p.id} {p.connected ? "(Connected)" : "(Disconnected)"}
            </li>
          ))}
          {players.length === 0 && <p className="text-gray-500 italic">Waiting for players...</p>}
        </ul>
      </div>
      {isHost && players.length > 0 && (
        <button
          onClick={() => sendAction("start_zamours")}
          className="px-8 py-4 bg-blue-600 rounded-xl font-bold hover:bg-blue-500 transition-colors"
        >
          START GAME
        </button>
      )}
      {!isHost && <p className="animate-pulse">Waiting for host to start...</p>}
    </div>
  );
};

export const Game1 = ({ gameState, role, sendAction }: PhaseProps) => {
  const isHost = role === "host";
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-indigo-900 text-white">
      <h1 className="text-3xl font-bold mb-4">Game Phase 1</h1>
      <div className="text-xl mb-8">
        Round: {gameState.game_data.round}
      </div>
      
      {isHost ? (
        <div className="text-center">
          <h2 className="text-xl mb-4">Host View</h2>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(gameState.players).map(([id, p]) => (
              <div key={id} className="p-4 bg-white/10 rounded-lg">
                <p className="font-bold">{id}</p>
                <p className="text-sm">{gameState.game_data[id] ? "Done!" : "Deciding..."}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <p className="text-center">Choose an action:</p>
          <button
            onClick={() => sendAction("player_action", { value: "A" })}
            className="p-4 bg-green-600 rounded-lg font-bold"
          >
            Action A
          </button>
          <button
            onClick={() => sendAction("player_action", { value: "B" })}
            className="p-4 bg-red-600 rounded-lg font-bold"
          >
            Action B
          </button>
        </div>
      )}
    </div>
  );
};
