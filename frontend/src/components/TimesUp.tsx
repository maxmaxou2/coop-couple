"use client";
import React, { useState, useEffect } from "react";
import { GameState } from "@/hooks/useGameSocket";

interface Props { gameState: GameState; role: string; sendAction: (action: string, payload?: any) => void; }

const Timer = ({ end, running, onEnd }: { end: number; running: boolean; onEnd?: () => void }) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!running || end === 0) { setTimeLeft(0); return; }
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((end - now) / 1000));
      setTimeLeft(diff);
      if (diff <= 0) { clearInterval(interval); if (onEnd) onEnd(); }
    }, 200);
    return () => clearInterval(interval);
  }, [end, running, onEnd]);

  return <div className={`text-8xl font-black tabular-nums ${timeLeft <= 5 && timeLeft > 0 ? "text-red-500 animate-ping" : "text-white"}`}>{timeLeft}</div>;
};

export const TimesUpHost = ({ gameState, sendAction }: Props) => {
  const { round, current_words, speaker_id, timer_running, timer_end, initial_words } = gameState.game_data;
  const speaker = gameState.players[speaker_id];
  const wordsLeft = current_words?.length || 0;
  
  const roundTitles = ["Description Libre", "Un seul mot", "Mime"];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-orange-950 text-white text-center">
      <div className="fixed top-8 left-8 right-8 flex justify-between items-center">
        <div className="bg-white/10 px-6 py-2 rounded-full font-bold uppercase tracking-widest text-sm">Manche {round} / 3</div>
        <div className="bg-orange-600 px-6 py-2 rounded-full font-bold">{wordsLeft} / {initial_words?.length} mots restants</div>
      </div>
      <div className="mb-12">
        <h2 className="text-4xl font-black mb-4 text-orange-400 uppercase tracking-tighter">{roundTitles[round - 1]}</h2>
      </div>
      <div className="mb-16">
        <Timer end={timer_end} running={timer_running} onEnd={() => {}} />
        <p className="mt-4 text-2xl font-bold uppercase tracking-widest text-orange-300">Au tour de <span className="text-white">{speaker?.name}</span></p>
      </div>
      <div className="flex gap-4">
        {!timer_running && wordsLeft > 0 && (
          <button onClick={() => sendAction("start_turn")} className="px-12 py-6 bg-green-600 rounded-3xl font-black text-2xl hover:bg-green-500 transition-all">LANCER LE CHRONO</button>
        )}
        {timer_running && (
          <button onClick={() => sendAction("end_turn")} className="px-12 py-6 bg-red-600 rounded-3xl font-black text-2xl hover:bg-red-500 transition-all">ARRÊTER LE TOUR</button>
        )}
        {wordsLeft === 0 && (
          <button onClick={() => sendAction("next_times_up_round")} className="px-12 py-6 bg-white text-orange-950 rounded-3xl font-black text-2xl hover:bg-gray-200 transition-all">
            {round < 3 ? "MANCHE SUIVANTE" : "RETOUR AU LOBBY"}
          </button>
        )}
      </div>
    </div>
  );
};

export const TimesUpPlayer = ({ gameState, role, sendAction }: Props) => {
  const { current_word, speaker_id, timer_running, timer_end, round } = gameState.game_data;
  const isSpeaker = role === speaker_id;
  const isTimeUp = timer_running && Date.now() >= timer_end;

  if (!timer_running) return <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-8">Attendez que le host lance...</div>;

  if (isSpeaker) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-orange-700 text-white text-center">
        <div className="fixed top-8"><Timer end={timer_end} running={timer_running} /></div>
        <div className="bg-white text-orange-900 p-12 rounded-[3rem] shadow-2xl mb-8 w-full max-w-sm">
          <h2 className="text-5xl font-black leading-tight break-words">{current_word}</h2>
        </div>
        <div className="flex flex-col gap-4 w-full max-w-sm">
          <button onClick={() => sendAction("word_guessed")} disabled={isTimeUp} className="w-full p-10 bg-green-500 rounded-[3rem] font-black text-4xl shadow-2xl active:scale-95 disabled:opacity-20 transition-all">TROUVÉ !</button>
          <button onClick={() => sendAction("skip_word")} disabled={isTimeUp} className="w-full p-6 bg-white/20 rounded-[2rem] font-bold text-xl active:scale-95 disabled:opacity-0 transition-all">PASSER</button>
        </div>
      </div>
    );
  }
  return <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-8"><Timer end={timer_end} running={timer_running} /><h1 className="text-3xl font-black uppercase mt-12">Devinez !</h1></div>;
};
