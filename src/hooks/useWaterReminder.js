import { useEffect, useRef, useCallback, useState } from 'react';

const INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const CHIME_LOOP_MS = 4000; // replay chime every 4 seconds
const STORAGE_KEY = 'pms_water_next';

function getNextTime() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const t = Number(stored);
    if (t > Date.now()) return t;
  }
  const next = Date.now() + INTERVAL_MS;
  localStorage.setItem(STORAGE_KEY, String(next));
  return next;
}

function setNextTime() {
  const next = Date.now() + INTERVAL_MS;
  localStorage.setItem(STORAGE_KEY, String(next));
  return next;
}

function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    const notes = [659.25, 783.99, 987.77];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + i * 0.15);
      gain.gain.linearRampToValueAtTime(0.18, now + i * 0.15 + 0.05);
      gain.gain.linearRampToValueAtTime(0, now + i * 0.15 + 0.6);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.7);
    });
    setTimeout(() => ctx.close(), 2000);
  } catch { /* ignore */ }
}

export default function useWaterReminder() {
  const [showReminder, setShowReminder] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(() => {
    return Math.max(0, Math.round((getNextTime() - Date.now()) / 1000));
  });
  const nextRef = useRef(getNextTime());
  const chimeLoopRef = useRef(null);

  const stopChimeLoop = useCallback(() => {
    if (chimeLoopRef.current) {
      clearInterval(chimeLoopRef.current);
      chimeLoopRef.current = null;
    }
  }, []);

  const startChimeLoop = useCallback(() => {
    stopChimeLoop();
    playChime();
    chimeLoopRef.current = setInterval(playChime, CHIME_LOOP_MS);
  }, [stopChimeLoop]);

  const triggerReminder = useCallback(() => {
    startChimeLoop();
    setShowReminder(true);
    nextRef.current = setNextTime();
  }, [startChimeLoop]);

  const dismissReminder = useCallback(() => {
    stopChimeLoop();
    setShowReminder(false);
  }, [stopChimeLoop]);

  const testReminder = useCallback(() => {
    startChimeLoop();
    setShowReminder(true);
  }, [startChimeLoop]);

  // Cleanup on unmount
  useEffect(() => stopChimeLoop, [stopChimeLoop]);

  // Countdown tick every second + trigger when time is up
  useEffect(() => {
    const id = setInterval(() => {
      const diff = Math.max(0, Math.round((nextRef.current - Date.now()) / 1000));
      setSecondsLeft(diff);
      if (diff === 0) {
        triggerReminder();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [triggerReminder]);

  return { showReminder, dismissReminder, testReminder, secondsLeft };
}
