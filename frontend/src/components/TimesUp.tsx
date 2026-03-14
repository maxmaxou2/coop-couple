"use client";
import React, { useState, useEffect } from "react";
import { GameState } from "@/hooks/useGameSocket";

interface Props {
  gameState: GameState;
  role: string;
  sendAction: (action: string, payload?: any) => void;
}

const Timer = ({ end, running }: { end: number; running: boolean }) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!running || end === 0) {
      setTimeLeft(0);
      return;
    }
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((end - now) / 1000));
      setTimeLeft(diff);
      if (diff <= 0) clearInterval(interval);
    }, 200);
    return () => clearInterval(interval);
  }, [end, running]);

  return (
    <div className={`text-8xl font-black tabular-nums ${timeLeft <= 5 && timeLeft > 0 ? "text-red-500 animate-ping" : "text-white"}`}>
      {timeLeft}
    </div>
  );
};

export const TimesUpHost = ({ gameState, sendAction }: Props) => {
  const { round, current_words, speaker_id, timer_running, timer_end, initial_words } = gameState.game_data;
  const speaker = gameState.players[speaker_id];
  const wordsLeft = current_words?.length || 0;
  
  const roundTitles = ["Description Libre", "Un seul mot", "Mime"];
  const roundDesc = [
    "Décrivez le mot sans le nommer et sans utiliser de mots de la même famille.",
    "Un seul et unique mot pour faire deviner ! Choisissez bien.",
    "Interdiction de parler. Utilisez votre corps pour mimer le mot."
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-orange-950 text-white text-center">
      <div className="fixed top-8 left-8 right-8 flex justify-between items-center">
        <div className="bg-white/10 px-6 py-2 rounded-full font-bold uppercase tracking-widest text-sm">
          Manche {round} / 3
        </div>
        <div className="bg-orange-600 px-6 py-2 rounded-full font-bold">
          {wordsLeft} / {initial_words?.length} mots restants
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-4xl font-black mb-4 text-orange-400 uppercase tracking-tighter">{roundTitles[round - 1]}</h2>
        <p className="text-xl opacity-60 max-w-xl mx-auto italic">{roundDesc[round - 1]}</p>
      </div>

      <div className="mb-16">
        <Timer end={timer_end} running={timer_running} />
        <p className="mt-4 text-2xl font-bold uppercase tracking-widest text-orange-300">
          C'est au tour de <span className="text-white underline">{speaker?.name}</span>
        </p>
      </div>

      <div className="flex gap-4">
        {!timer_running && wordsLeft > 0 && (
          <button
            onClick={() => sendAction("start_turn")}
            className="px-12 py-6 bg-green-600 rounded-3xl font-black text-2xl hover:bg-green-500 transition-all"
          >
            LANCER LE CHRONO
          </button>
        )}
        {timer_running && (
          <button
            onClick={() => sendAction("end_turn")}
            className="px-12 py-6 bg-red-600 rounded-3xl font-black text-2xl hover:bg-red-500 transition-all"
          >
            ARRÊTER LE TOUR
          </button>
        )}
        {wordsLeft === 0 && (
          <button
            onClick={() => sendAction("next_round")}
            className="px-12 py-6 bg-white text-orange-950 rounded-3xl font-black text-2xl hover:bg-gray-200 transition-all"
          >
            {round < 3 ? "MANCHE SUIVANTE" : "FIN DU JEU"}
          </button>
        )}
      </div>
    </div>
  );
};

export const TimesUpPlayer = ({ gameState, role, sendAction }: Props) => {
  const { current_word, speaker_id, timer_running, timer_end, round } = gameState.game_data;
  const isSpeaker = role === speaker_id;
  const speaker = gameState.players[speaker_id];

  const roundTitles = ["Description Libre", "Un seul mot", "Mime"];

  if (!timer_running) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-900 text-white text-center">
        <h2 className="text-xl opacity-50 uppercase tracking-widest mb-4">Manche {round} : {roundTitles[round-1]}</h2>
        <h1 className="text-4xl font-black mb-8">{isSpeaker ? "Préparez-vous !" : `C'est au tour de ${speaker?.name}`}</h1>
        <p className="opacity-40 italic">Attendez que le host lance le chrono...</p>
      </div>
    );
  }

  if (isSpeaker) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-orange-700 text-white text-center">
        <div className="fixed top-8 left-0 right-0">
          <Timer end={timer_end} running={timer_running} />
        </div>
        <div className="bg-white text-orange-900 p-12 rounded-[3rem] shadow-2xl mb-12 w-full max-w-sm">
          <p className="text-sm font-bold uppercase opacity-40 mb-2">Fais deviner :</p>
          <h2 className="text-5xl font-black leading-tight break-words">{current_word}</h2>
        </div>
        <button
          onClick={() => sendAction("word_guessed")}
          className="w-full max-w-sm p-10 bg-green-500 rounded-[3rem] font-black text-4xl shadow-2xl active:scale-95 transition-transform"
        >
          TROUVÉ !
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-900 text-white text-center">
      <div className="mb-12">
        <Timer end={timer_end} running={timer_running} />
      </div>
      <h1 className="text-3xl font-black uppercase tracking-tighter mb-4 text-orange-400">Devinez ce que dit</h1>
      <h2 className="text-6xl font-black underline decoration-orange-500">{speaker?.name}</h2>
    </div>
  );
};
