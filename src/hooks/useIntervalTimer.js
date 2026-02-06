import { useState, useEffect, useCallback, useRef } from 'react';

// Audio beep helper using Web Audio API
let audioContext = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Resume if suspended (browser policy requires user gesture)
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
};

const playBeep = (frequency, duration, count = 1) => {
  try {
    const ctx = getAudioContext();
    for (let i = 0; i < count; i++) {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3; // moderate volume
      const startTime = ctx.currentTime + (i * 0.2);
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    }
  } catch (e) {
    // Audio not available — silently continue
  }
};

const playWorkToRest = () => playBeep(880, 0.15, 1);    // single high beep
const playRestToWork = () => playBeep(660, 0.12, 2);    // two quick beeps
const playComplete = () => {                              // three ascending tones
  try {
    const ctx = getAudioContext();
    [523, 659, 784].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.value = 0.3;
      const startTime = ctx.currentTime + (i * 0.25);
      osc.start(startTime);
      osc.stop(startTime + 0.2);
    });
  } catch (e) {
    // Audio not available — silently continue
  }
};

/**
 * useIntervalTimer - state machine hook for interval exercises
 *
 * States: 'idle' → 'work' → 'rest' → 'work' → ... → 'complete'
 *
 * @param {Object} config
 * @param {number} config.workDuration - seconds of work per round
 * @param {number} config.restDuration - seconds of rest between rounds
 * @param {number} config.rounds - total number of work rounds
 */
const useIntervalTimer = ({ workDuration, restDuration, rounds }) => {
  const [state, setState] = useState('idle');       // 'idle' | 'work' | 'rest' | 'complete' | 'paused'
  const [currentRound, setCurrentRound] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(workDuration);
  const [totalElapsed, setTotalElapsed] = useState(0);

  // Store the state before pausing so we can resume correctly
  const pausedStateRef = useRef(null);
  const intervalRef = useRef(null);

  // Clear interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Main timer tick
  useEffect(() => {
    if (state !== 'work' && state !== 'rest') {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Phase is ending — transition
          if (state === 'work') {
            setCurrentRound(round => {
              if (round >= rounds) {
                // All rounds done
                setState('complete');
                playComplete();
                return round;
              } else {
                // Transition to rest
                setState('rest');
                playWorkToRest();
                setTimeRemaining(restDuration);
                return round;
              }
            });
          } else if (state === 'rest') {
            // Transition to next work round
            setCurrentRound(r => r + 1);
            setState('work');
            playRestToWork();
            setTimeRemaining(workDuration);
          }
          return 0; // will be overwritten by the setTimeRemaining in transitions
        }
        return prev - 1;
      });
      setTotalElapsed(prev => prev + 1);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state, rounds, workDuration, restDuration]);

  const start = useCallback(() => {
    // Initialize AudioContext on user gesture
    getAudioContext();
    setState('work');
    setCurrentRound(1);
    setTimeRemaining(workDuration);
    setTotalElapsed(0);
    pausedStateRef.current = null;
  }, [workDuration]);

  const pause = useCallback(() => {
    if (state === 'work' || state === 'rest') {
      pausedStateRef.current = state;
      setState('paused');
    }
  }, [state]);

  const resume = useCallback(() => {
    if (state === 'paused' && pausedStateRef.current) {
      setState(pausedStateRef.current);
      pausedStateRef.current = null;
    }
  }, [state]);

  const reset = useCallback(() => {
    setState('idle');
    setCurrentRound(1);
    setTimeRemaining(workDuration);
    setTotalElapsed(0);
    pausedStateRef.current = null;
  }, [workDuration]);

  return {
    state,
    currentRound,
    timeRemaining,
    totalElapsed,
    start,
    pause,
    resume,
    reset
  };
};

export default useIntervalTimer;
