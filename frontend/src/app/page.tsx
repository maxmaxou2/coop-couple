"use client";
import React, { useState } from "react";
import { useGameSocket } from "@/hooks/useGameSocket";
import { Lobby } from "@/components/Phases";
import { ZamoursHost, ZamoursPlayer } from "@/components/Zamours";

export default function Home() {
  const [role, setRole] = useState<string | null>(null);
  const { gameState, isConnected, sendAction } = useGameSocket(role || "");

  if (!role) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8 bg-black text-white">
        <h1 className="text-4xl font-black mb-8">COOP COUPLE</h1>
        <button
          onClick={() => setRole("host")}
          className="w-full max-w-sm p-6 bg-white text-black font-black text-xl rounded-2xl hover:bg-gray-200 transition-transform active:scale-95"
        >
          I AM THE HOST
        </button>
        <div className="flex gap-4 w-full max-w-sm">
          <button
            onClick={() => setRole("player1")}
            className="flex-1 p-6 bg-blue-600 font-bold rounded-2xl hover:bg-blue-500 transition-transform active:scale-95"
          >
            Player 1
          </button>
          <button
            onClick={() => setRole("player2")}
            className="flex-1 p-6 bg-pink-600 font-bold rounded-2xl hover:bg-pink-500 transition-transform active:scale-95"
          >
            Player 2
          </button>
        </div>
      </div>
    );
  }

  if (!isConnected || !gameState) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950 text-white">
        <p className="animate-pulse font-mono tracking-widest uppercase">Connecting as {role}...</p>
      </div>
    );
  }

  const isHost = role === "host";

  if (gameState.current_phase === "lobby") {
    return <Lobby gameState={gameState} role={role} sendAction={sendAction} />;
  }

  if (gameState.current_phase === "zamours") {
    return isHost ? (
      <ZamoursHost gameState={gameState} role={role} sendAction={sendAction} />
    ) : (
      <ZamoursPlayer gameState={gameState} role={role} sendAction={sendAction} />
    );
  }

  return <div className="text-white bg-red-900 p-8">Phase Unknown: {gameState.current_phase}</div>;
}
