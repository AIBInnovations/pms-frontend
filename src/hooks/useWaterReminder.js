import { useEffect, useRef, useCallback, useState } from 'react';

const INTERVAL_MS = 60 * 60 * 1000; // 1 hour

function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;

    // Pleasant two-tone chime
    const notes = [659.25, 783.99, 987.77]; // E5, G5, B5
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

    // Clean up context after sound finishes
    setTimeout(() => ctx.close(), 2000);
    return true;
  } catch {
    return false;
  }
}

export default function useWaterReminder() {
  const intervalRef = useRef(null);
  const [showReminder, setShowReminder] = useState(false);

  const triggerReminder = useCallback(() => {
    playChime();
    setShowReminder(true);
    // Auto-dismiss after 10 seconds
    setTimeout(() => setShowReminder(false), 10000);
  }, []);

  const dismissReminder = useCallback(() => {
    setShowReminder(false);
  }, []);

  const testSound = useCallback(() => {
    playChime();
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(triggerReminder, INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
  }, [triggerReminder]);

  return { showReminder, dismissReminder, testSound, triggerReminder };
}
