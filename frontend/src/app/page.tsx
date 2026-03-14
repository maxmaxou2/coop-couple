"use client";
import React, { useState, useEffect } from "react";
import { useGameSocket } from "@/hooks/useGameSocket";
import { Lobby } from "@/components/Phases";
import { ZamoursHost, ZamoursPlayer } from "@/components/Zamours";
import { TelepathicHost, TelepathicPlayer } from "@/components/TelepathicGauge";
import { TimesUpHost, TimesUpPlayer } from "@/components/TimesUp";
import { BlindDrawingHost, BlindDrawingPlayer } from "@/components/BlindDrawing";

export default function Home() {
  const [role, setRole] = useState<string | null>(null);
  const [name, setName] = useState("");
  const { gameState, isConnected, sendAction } = useGameSocket(role || "");

  useEffect(() => {
    if (isConnected && role && role !== "host" && name) {
      sendAction("set_name", { name });
    }
  }, [isConnected, role, name, sendAction]);

  if (!role) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8 bg-black text-white">
        <h1 className="text-4xl font-black mb-8 italic tracking-tighter uppercase">Coop Couple</h1>
        <div className="w-full max-w-sm mb-8 space-y-4">
          <input 
            type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Ton Prénom"
            className="w-full p-4 bg-white/10 border-2 border-white/20 rounded-2xl text-center text-xl outline-none focus:border-white transition-colors"
          />
        </div>
        <button onClick={() => setRole("host")} className="w-full max-w-sm p-6 bg-white text-black font-black text-xl rounded-2xl hover:scale-105 transition-transform">ÉCRAN PRINCIPAL</button>
        <div className="flex gap-4 w-full max-w-sm">
          <button onClick={() => setRole("player1")} disabled={!name.trim()} className="flex-1 p-6 bg-blue-600 font-bold rounded-2xl disabled:opacity-30 hover:scale-105 transition-transform">Joueur 1</button>
          <button onClick={() => setRole("player2")} disabled={!name.trim()} className="flex-1 p-6 bg-pink-600 font-bold rounded-2xl disabled:opacity-30 hover:scale-105 transition-transform">Joueur 2</button>
        </div>
      </div>
    );
  }

  if (!isConnected || !gameState) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950 text-white">
        <p className="animate-pulse font-mono tracking-widest uppercase text-sm">Connexion en cours : {role === "host" ? "Écran Principal" : role}...</p>
      </div>
    );
  }

  const isHost = role === "host";

  if (gameState.current_phase === "lobby") return <Lobby gameState={gameState} role={role} sendAction={sendAction} />;
  
  if (gameState.current_phase === "zamours") {
    return isHost ? <ZamoursHost gameState={gameState} role={role} sendAction={sendAction} /> : <ZamoursPlayer gameState={gameState} role={role} sendAction={sendAction} />;
  }

  if (gameState.current_phase === "telepathic_gauge") {
    return isHost ? <TelepathicHost gameState={gameState} role={role} sendAction={sendAction} /> : <TelepathicPlayer gameState={gameState} role={role} sendAction={sendAction} />;
  }

  if (gameState.current_phase === "times_up") {
    return isHost ? <TimesUpHost gameState={gameState} role={role} sendAction={sendAction} /> : <TimesUpPlayer gameState={gameState} role={role} sendAction={sendAction} />;
  }

  if (gameState.current_phase === "blind_drawing") {
    return isHost ? <BlindDrawingHost gameState={gameState} role={role} sendAction={sendAction} /> : <BlindDrawingPlayer gameState={gameState} role={role} sendAction={sendAction} />;
  }

  return null;
}
