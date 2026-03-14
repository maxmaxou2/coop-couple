"use client";
import React, { useState, useRef, useEffect } from "react";
import { GameState } from "@/hooks/useGameSocket";

interface Props { gameState: GameState; role: string; sendAction: (action: string, payload?: any) => void; }

export const BlindDrawingHost = ({ gameState, sendAction }: Props) => {
  const { target_image, drawing_base64, step, guide_id, drawer_id } = gameState.game_data;
  const guide = gameState.players[guide_id];
  const dessinateur = gameState.players[drawer_id];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-zinc-950 text-white text-center">
      <h1 className="text-4xl font-black mb-12 uppercase tracking-tighter italic text-zinc-400">Dessin à l'Aveugle</h1>
      {step === "waiting_draw" ? (
        <div className="animate-pulse">
          <p className="text-2xl font-bold mb-4">{guide?.name} décrit...</p>
          <p className="text-4xl font-black italic">{dessinateur?.name} dessine !</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-12 w-full max-w-6xl">
          <div className="grid grid-cols-2 gap-12 w-full">
            <div className="space-y-4">
              <p className="text-xl font-bold text-zinc-500 uppercase">Modèle Original</p>
              <img src={target_image} alt="Target" className="w-full rounded-3xl border-4 border-zinc-800 shadow-2xl" />
            </div>
            <div className="space-y-4">
              <p className="text-xl font-bold text-zinc-500 uppercase">Dessin de {dessinateur?.name}</p>
              <img src={drawing_base64} alt="Drawing" className="w-full rounded-3xl border-4 bg-white shadow-2xl" />
            </div>
          </div>
          <button onClick={() => sendAction("next_drawing_round")} className="px-12 py-6 bg-white text-black rounded-3xl font-black text-2xl hover:scale-105 transition-all">MANCHE SUIVANTE</button>
        </div>
      )}
    </div>
  );
};

export const BlindDrawingPlayer = ({ gameState, role, sendAction }: Props) => {
  const { target_image, guide_id, drawer_id, step } = gameState.game_data;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const [history, setHistory] = useState<ImageData[]>([]);

  useEffect(() => {
    if (role === drawer_id && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d", { willReadFrequently: true });
      if (ctx) { ctx.strokeStyle = "black"; ctx.lineWidth = 5; ctx.lineCap = "round"; ctx.lineJoin = "round"; }
    }
  }, [role, drawer_id]);

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setHistory(prev => [...prev, currentState]);
      }
    }
  };

  const undo = () => {
    if (history.length === 0) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        const lastState = history[history.length - 1];
        ctx.putImageData(lastState, 0, 0);
        setHistory(prev => prev.slice(0, -1));
      }
    }
  };

  const getPos = (e: any) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * (800 / rect.width), y: (clientY - rect.top) * (600 / rect.height) };
  };

  const startDrawing = (e: any) => {
    saveToHistory(); // Sauvegarde l'état AVANT le nouveau trait
    isDrawing.current = true;
    const { x, y } = getPos(e);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) { ctx.beginPath(); ctx.moveTo(x, y); }
  };

  const draw = (e: any) => {
    if (!isDrawing.current || !canvasRef.current) return;
    if (e.cancelable) e.preventDefault();
    const { x, y } = getPos(e);
    const ctx = canvasRef.current.getContext("2d");
    if (ctx) { ctx.lineTo(x, y); ctx.stroke(); }
  };

  const clearCanvas = () => {
    saveToHistory();
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  if (role === guide_id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-zinc-900 text-white text-center">
        <h2 className="text-xl font-bold mb-8 uppercase opacity-50 tracking-widest">Rôle : GUIDE</h2>
        <img src={target_image} alt="Guide target" className="w-full max-w-sm rounded-3xl border-4 mb-8 shadow-2xl" />
        <p className="italic text-lg">Décris ce dessin uniquement avec des formes géométriques.</p>
      </div>
    );
  }

  if (role === drawer_id) {
    if (step === "reveal") return <div className="flex items-center justify-center min-h-screen bg-zinc-900 text-white uppercase italic text-2xl animate-pulse">Envoyé !</div>;
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-zinc-900 text-white touch-none fixed inset-0">
        <h2 className="text-lg font-black mb-4 uppercase italic text-zinc-500 tracking-tighter">Dessine ici</h2>
        <div className="w-full max-w-md aspect-[4/3] bg-white rounded-3xl overflow-hidden mb-6 shadow-2xl border-4 border-white/5">
          <canvas ref={canvasRef} width={800} height={600} className="w-full h-full cursor-crosshair touch-none"
            onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={() => isDrawing.current = false} onMouseLeave={() => isDrawing.current = false}
            onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={() => isDrawing.current = false} />
        </div>
        <div className="grid grid-cols-3 gap-3 w-full max-w-md">
          <button onClick={undo} className="p-5 bg-zinc-800 rounded-2xl font-bold uppercase text-xs active:bg-zinc-700 transition-colors">Annuler</button>
          <button onClick={clearCanvas} className="p-5 bg-zinc-800 rounded-2xl font-bold uppercase text-xs active:bg-zinc-700 transition-colors">Effacer</button>
          <button onClick={() => sendAction("submit_drawing", { drawing: canvasRef.current?.toDataURL() })} className="p-5 bg-white text-black rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95 transition-transform">Terminer</button>
        </div>
      </div>
    );
  }
  return null;
};
