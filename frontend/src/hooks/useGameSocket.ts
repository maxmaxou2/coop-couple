import { useState, useEffect, useRef, useCallback } from "react";

export type Phase = "lobby" | "zamours";

export interface Player {
  id: string;
  name?: string;
  connected: boolean;
}

export interface GameState {
  current_phase: Phase;
  players: Record<string, Player>;
  game_data: Record<string, any>;
}

export const useGameSocket = (role: string) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!role) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.hostname;
    const socket = new WebSocket(`${protocol}//${host}:8000/ws/${role}`);

    socket.onopen = () => setIsConnected(true);
    socket.onclose = () => setIsConnected(false);
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.action === "state_update") {
        setGameState(data.payload);
      }
    };

    socketRef.current = socket;
    return () => socket.close();
  }, [role]);

  const sendAction = useCallback((action: string, payload: any = {}) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ action, payload }));
    }
  }, []);

  return { gameState, isConnected, sendAction };
};
