import { useEffect, useRef, useCallback, useState } from 'react';

const INTERVAL_MS = 60 * 60 * 1000; // 1 hour

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
  const [secondsLeft, setSecondsLeft] = useState(INTERVAL_MS / 1000);
  const nextRef = useRef(Date.now() + INTERVAL_MS);

  const triggerReminder = useCallback(() => {
    playChime();
    setShowReminder(true);
    nextRef.current = Date.now() + INTERVAL_MS;
    setTimeout(() => setShowReminder(false), 10000);
  }, []);

  const dismissReminder = useCallback(() => {
    setShowReminder(false);
  }, []);

  const testSound = useCallback(() => {
    playChime();
  }, []);

  // Main interval
  useEffect(() => {
    const id = setInterval(triggerReminder, INTERVAL_MS);
    return () => clearInterval(id);
  }, [triggerReminder]);

  // Countdown tick every second
  useEffect(() => {
    const id = setInterval(() => {
      const diff = Math.max(0, Math.round((nextRef.current - Date.now()) / 1000));
      setSecondsLeft(diff);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return { showReminder, dismissReminder, testSound, secondsLeft };
}
