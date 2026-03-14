"use client";
import React, { useState, useRef, useEffect } from "react";
import { GameState } from "@/hooks/useGameSocket";

interface Props {
  gameState: GameState;
  role: string;
  sendAction: (action: string, payload?: any) => void;
}

export const BlindDrawingHost = ({ gameState, sendAction }: Props) => {
  const { target_image, drawing_base64, step, guide_id, drawer_id } = gameState.game_data;
  const guide = gameState.players[guide_id];
  const dessinateur = gameState.players[drawer_id];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-zinc-950 text-white text-center">
      <h1 className="text-4xl font-black mb-12 uppercase tracking-tighter italic text-zinc-400">Dessin à l'Aveugle</h1>
      
      {step === "waiting_draw" ? (
        <div className="animate-pulse">
          <p className="text-2xl font-bold mb-4 text-white uppercase tracking-widest">{guide?.name} décrit...</p>
          <p className="text-4xl font-black text-white uppercase tracking-widest italic">{dessinateur?.name} dessine !</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-12 w-full max-w-6xl">
          <div className="grid grid-cols-2 gap-12 w-full">
            <div className="space-y-4">
              <p className="text-xl font-bold text-zinc-500 uppercase">Modèle Original</p>
              <img src={target_image} alt="Target" className="w-full rounded-3xl shadow-2xl border-4 border-zinc-800" />
            </div>
            <div className="space-y-4">
              <p className="text-xl font-bold text-zinc-500 uppercase">Dessin de {dessinateur?.name}</p>
              <img src={drawing_base64} alt="Drawing" className="w-full rounded-3xl shadow-2xl border-4 border-white/10 bg-white" />
            </div>
          </div>
          <button
            onClick={() => sendAction("next_drawing_round")}
            className="px-12 py-6 bg-white text-black rounded-3xl font-black text-2xl hover:scale-105 transition-transform"
          >
            MANCHE SUIVANTE
          </button>
        </div>
      )}
    </div>
  );
};

export const BlindDrawingPlayer = ({ gameState, role, sendAction }: Props) => {
  const { target_image, guide_id, drawer_id, step } = gameState.game_data;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  useEffect(() => {
    if (role === drawer_id && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = "black";
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }
    }
  }, [role, drawer_id]);

  const getPos = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    return {
      x: (clientX - rect.left) * (canvasRef.current.width / rect.width),
      y: (clientY - rect.top) * (canvasRef.current.height / rect.height)
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    isDrawing.current = true;
    const { x, y } = getPos(e);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current || !canvasRef.current) return;
    if (e.cancelable) e.preventDefault();
    const { x, y } = getPos(e);
    const ctx = canvasRef.current.getContext("2d");
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const finishDrawing = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      sendAction("submit_drawing", { drawing: canvas.toDataURL("image/png") });
    }
  };

  if (role === guide_id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-zinc-900 text-white text-center">
        <h2 className="text-xl font-bold mb-8 uppercase opacity-50 italic">Ton Rôle : GUIDE</h2>
        <img src={target_image} alt="Guide target" className="w-full max-w-sm rounded-3xl border-4 border-white/20 shadow-2xl mb-8" />
        <p className="text-lg italic opacity-70">Décris ce dessin uniquement avec des termes géométriques.</p>
        {step === "reveal" && <p className="mt-8 font-bold text-green-400">Révélation en cours !</p>}
      </div>
    );
  }

  if (role === drawer_id) {
    if (step === "reveal") return <div className="flex items-center justify-center min-h-screen bg-zinc-900 text-white font-black uppercase italic text-2xl animate-pulse">Envoyé !</div>;

    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-zinc-900 text-white overflow-hidden fixed inset-0 touch-none">
        <h2 className="text-lg font-black mb-4 uppercase italic text-zinc-500 tracking-tighter">Dessine ici</h2>
        <div className="w-full max-w-md aspect-[4/3] bg-white rounded-3xl overflow-hidden shadow-2xl mb-6 relative">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="w-full h-full cursor-crosshair touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>
        <div className="flex gap-4 w-full max-w-md">
          <button onClick={clearCanvas} className="flex-1 p-5 bg-zinc-800 rounded-2xl font-bold uppercase tracking-widest border border-white/10">Effacer</button>
          <button onClick={finishDrawing} className="flex-1 p-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest italic shadow-xl active:scale-95 transition-transform">Terminer</button>
        </div>
      </div>
    );
  }

  return <div className="p-10 text-white">Observateur...</div>;
};
