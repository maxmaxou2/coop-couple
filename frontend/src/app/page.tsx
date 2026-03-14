"use client";
import React, { useState, useEffect } from "react";
import { useGameSocket } from "@/hooks/useGameSocket";
import { Lobby } from "@/components/Phases";
import { ZamoursHost, ZamoursPlayer } from "@/components/Zamours";

export default function Home() {
  const [role, setRole] = useState<string | null>(null);
  const [name, setName] = useState("");
  const { gameState, isConnected, sendAction } = useGameSocket(role || "");

  // Send name once connected as a player
  useEffect(() => {
    if (isConnected && role && role !== "host" && name) {
      sendAction("set_name", { name });
    }
  }, [isConnected, role, name, sendAction]);

  if (!role) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8 bg-black text-white">
        <h1 className="text-4xl font-black mb-8 italic">COOP COUPLE</h1>
        
        <div className="w-full max-w-sm mb-8 space-y-4">
          <p className="text-center opacity-60 uppercase text-xs tracking-widest">Ton Prénom</p>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Maxence"
            className="w-full p-4 bg-white/10 border-2 border-white/20 rounded-2xl text-center text-xl outline-none focus:border-white transition-colors"
          />
        </div>

        <button
          onClick={() => setRole("host")}
          className="w-full max-w-sm p-6 bg-white text-black font-black text-xl rounded-2xl hover:bg-gray-200"
        >
          ÉCRAN PRINCIPAL
        </button>
        
        <div className="flex gap-4 w-full max-w-sm">
          <button
            onClick={() => setRole("player1")}
            disabled={!name.trim()}
            className="flex-1 p-6 bg-blue-600 font-bold rounded-2xl hover:bg-blue-500 disabled:opacity-30 transition-all"
          >
            Joueur 1
          </button>
          <button
            onClick={() => setRole("player2")}
            disabled={!name.trim()}
            className="flex-1 p-6 bg-pink-600 font-bold rounded-2xl hover:bg-pink-500 disabled:opacity-30 transition-all"
          >
            Joueur 2
          </button>
        </div>
      </div>
    );
  }

  if (!isConnected || !gameState) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950 text-white">
        <p className="animate-pulse font-mono tracking-widest uppercase text-sm">Synchronisation {role}...</p>
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
