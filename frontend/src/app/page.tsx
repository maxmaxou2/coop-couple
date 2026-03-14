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
  const [isInitialized, setIsInitialized] = useState(false);
  const { gameState, isConnected, sendAction } = useGameSocket(role || "");

  // Load from localStorage on mount
  useEffect(() => {
    const savedRole = localStorage.getItem("coop_role");
    const savedName = localStorage.getItem("coop_name");
    if (savedRole) setRole(savedRole);
    if (savedName) setName(savedName);
    setIsInitialized(true);
  }, []);

  // Save to localStorage when values change
  useEffect(() => {
    if (isInitialized) {
      if (role) localStorage.setItem("coop_role", role);
      if (name) localStorage.setItem("coop_name", name);
    }
  }, [role, name, isInitialized]);

  // Send name once connected as a player
  useEffect(() => {
    if (isConnected && role && role !== "host" && name) {
      sendAction("set_name", { name });
    }
  }, [isConnected, role, name, sendAction]);

  const resetSession = () => {
    localStorage.removeItem("coop_role");
    localStorage.removeItem("coop_name");
    window.location.reload();
  };

  if (!isInitialized) return null;

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
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white gap-6">
        <p className="animate-pulse font-mono tracking-widest uppercase text-sm">Connexion en cours : {role === "host" ? "Écran Principal" : name}...</p>
        <button onClick={resetSession} className="text-xs opacity-30 underline uppercase tracking-widest">Changer de rôle / nom</button>
      </div>
    );
  }

  const isHost = role === "host";

  return (
    <div className="relative">
      {!isHost && (
        <button 
          onClick={resetSession}
          className="fixed bottom-4 right-4 z-50 p-2 bg-white/5 text-[10px] text-white/20 uppercase tracking-widest rounded-lg border border-white/5"
        >
          Reset
        </button>
      )}
      
      {gameState.current_phase === "lobby" && <Lobby gameState={gameState} role={role} sendAction={sendAction} />}
      
      {gameState.current_phase === "zamours" && (
        isHost ? <ZamoursHost gameState={gameState} role={role} sendAction={sendAction} /> : <ZamoursPlayer gameState={gameState} role={role} sendAction={sendAction} />
      )}

      {gameState.current_phase === "telepathic_gauge" && (
        isHost ? <TelepathicHost gameState={gameState} role={role} sendAction={sendAction} /> : <TelepathicPlayer gameState={gameState} role={role} sendAction={sendAction} />
      )}

      {gameState.current_phase === "times_up" && (
        isHost ? <TimesUpHost gameState={gameState} role={role} sendAction={sendAction} /> : <TimesUpPlayer gameState={gameState} role={role} sendAction={sendAction} />
      )}

      {gameState.current_phase === "blind_drawing" && (
        isHost ? <BlindDrawingHost gameState={gameState} role={role} sendAction={sendAction} /> : <BlindDrawingPlayer gameState={gameState} role={role} sendAction={sendAction} />
      )}
    </div>
  );
}
