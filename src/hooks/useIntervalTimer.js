import { useState, useEffect, useCallback, useRef } from 'react';

// Audio beep helper using Web Audio API
/** @type {AudioContext | null} */
let audioContext = null;

/** @returns {AudioContext} */
const getAudioContext = () => {
  if (!audioContext) {
    const Ctx = window.AudioContext || /** @type {any} */ (window).webkitAudioContext;
    audioContext = new Ctx();
  }
  // Resume if suspended (browser policy requires user gesture)
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
};

/**
 * @param {number} frequency
 * @param {number} duration - seconds
 */
const playBeep = (frequency, duration) => {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.3;
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (e) {
    // Audio not available — silently continue
  }
};

const playCountdownBeep = () => playBeep(600, 0.1);          // short tick for 3-2-1
const playWorkStart = () => playBeep(880, 0.25);             // longer tone when work phase starts
const playRestStart = () => {                                 // quick double beep for rest phase
  try {
    const ctx = getAudioContext();
    [0, 0.15].forEach(delay => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 440;
      osc.type = 'sine';
      gain.gain.value = 0.3;
      const startTime = ctx.currentTime + delay;
      osc.start(startTime);
      osc.stop(startTime + 0.1);
    });
  } catch (e) {
    // Audio not available — silently continue
  }
};
const playComplete = () => {                                  // three ascending tones
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
 * @typedef {'idle' | 'countdown' | 'work' | 'rest' | 'paused' | 'complete'} IntervalTimerState
 */

/**
 * @typedef {object} IntervalTimerInternals
 * @property {IntervalTimerState} state
 * @property {number} currentRound
 * @property {number} timeRemaining - seconds left in current phase
 * @property {number} totalElapsed - work+rest seconds in current block
 * @property {IntervalTimerState | null} pausedPhase - phase we were in before pausing
 * @property {{ totalTime: number, difficulty: number }[]} completedBlocks
 */

/**
 * @typedef {object} IntervalTimerControls
 * @property {IntervalTimerState} state
 * @property {number} currentRound
 * @property {number} timeRemaining
 * @property {number} totalElapsed
 * @property {{ totalTime: number, difficulty: number }[]} completedBlocks
 * @property {() => void} start
 * @property {() => void} pause
 * @property {() => void} resume
 * @property {() => void} reset
 * @property {() => void} goAgain
 * @property {(blockIndex: number, difficulty: number) => void} setBlockDifficulty
 */

/**
 * useIntervalTimer - state machine hook for interval exercises.
 * States: 'idle' → 'countdown' → 'work' → 'rest' → 'work' → ... → 'complete'.
 *
 * Uses refs for mutable timer state to avoid stale closure issues in setInterval.
 *
 * @param {{ workDuration: number, restDuration: number, rounds: number }} config
 * @returns {IntervalTimerControls}
 */
const useIntervalTimer = ({ workDuration, restDuration, rounds }) => {
  // React state for rendering
  // eslint-disable-next-line no-unused-vars
  const [renderTick, setRenderTick] = useState(0);

  // All mutable timer state lives in refs to avoid stale closures
  /** @type {import('react').MutableRefObject<IntervalTimerInternals>} */
  const timerState = useRef({
    state: 'idle',
    currentRound: 1,
    timeRemaining: workDuration,
    totalElapsed: 0,
    pausedPhase: null,
    completedBlocks: [],
  });

  /** @type {import('react').MutableRefObject<ReturnType<typeof setInterval> | null>} */
  const intervalRef = useRef(null);

  const forceRender = useCallback(() => {
    setRenderTick(t => t + 1);
  }, []);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  const startTicking = useCallback(() => {
    clearTimer();

    intervalRef.current = setInterval(() => {
      const ts = timerState.current;

      // Only tick in active phases
      if (ts.state !== 'countdown' && ts.state !== 'work' && ts.state !== 'rest') {
        return;
      }

      // Play countdown beeps at 3, 2, 1 seconds before phase ends
      if ((ts.state === 'work' || ts.state === 'rest') && ts.timeRemaining <= 4 && ts.timeRemaining > 1) {
        playCountdownBeep();
      }
      // Also play tick beeps during initial countdown at 3, 2, 1 before work starts
      if (ts.state === 'countdown' && ts.timeRemaining <= 4 && ts.timeRemaining > 1) {
        playCountdownBeep();
      }

      ts.timeRemaining -= 1;
      // Only count work and rest time toward totalElapsed (exclude countdown)
      if (ts.state === 'work' || ts.state === 'rest') {
        ts.totalElapsed += 1;
      }

      if (ts.timeRemaining <= 0) {
        // Phase just ended — transition to next phase
        if (ts.state === 'countdown') {
          // Countdown done → start first work phase
          ts.state = 'work';
          ts.timeRemaining = workDuration;
          playWorkStart();
        } else if (ts.state === 'work') {
          if (ts.currentRound >= rounds) {
            // Final round done → complete
            ts.state = 'complete';
            clearTimer();
            playComplete();
          } else {
            // Work done → rest
            ts.state = 'rest';
            ts.timeRemaining = restDuration;
            playRestStart();
          }
        } else if (ts.state === 'rest') {
          // Rest done → next work round
          ts.currentRound += 1;
          ts.state = 'work';
          ts.timeRemaining = workDuration;
          playWorkStart();
        }
      }

      forceRender();
    }, 1000);
  }, [workDuration, restDuration, rounds, clearTimer, forceRender]);

  const start = useCallback(() => {
    // Initialize AudioContext on user gesture
    getAudioContext();

    const ts = timerState.current;
    ts.state = 'countdown';
    ts.currentRound = 1;
    ts.timeRemaining = 5; // 5-second countdown before work starts
    ts.totalElapsed = 0;
    ts.pausedPhase = null;

    forceRender();
    startTicking();
  }, [forceRender, startTicking]);

  const pause = useCallback(() => {
    const ts = timerState.current;
    if (ts.state === 'countdown' || ts.state === 'work' || ts.state === 'rest') {
      ts.pausedPhase = ts.state;
      ts.state = 'paused';
      clearTimer();
      forceRender();
    }
  }, [clearTimer, forceRender]);

  const resume = useCallback(() => {
    const ts = timerState.current;
    if (ts.state === 'paused' && ts.pausedPhase) {
      ts.state = ts.pausedPhase;
      ts.pausedPhase = null;
      forceRender();
      startTicking();
    }
  }, [forceRender, startTicking]);

  const goAgain = useCallback(() => {
    // Save the current block and reset to idle — user hits Start Timer to begin next block
    clearTimer();
    const ts = timerState.current;
    ts.completedBlocks.push({
      totalTime: ts.totalElapsed,
      difficulty: 0  // will be set by the component via setBlockDifficulty
    });
    ts.state = 'idle';
    ts.currentRound = 1;
    ts.timeRemaining = workDuration;
    ts.totalElapsed = 0;
    ts.pausedPhase = null;
    forceRender();
  }, [workDuration, clearTimer, forceRender]);

  const setBlockDifficulty = useCallback(/** @param {number} blockIndex @param {number} difficulty */ (blockIndex, difficulty) => {
    const ts = timerState.current;
    if (blockIndex >= 0 && blockIndex < ts.completedBlocks.length) {
      ts.completedBlocks[blockIndex].difficulty = difficulty;
      forceRender();
    }
  }, [forceRender]);

  const reset = useCallback(() => {
    clearTimer();
    const ts = timerState.current;
    ts.state = 'idle';
    ts.currentRound = 1;
    ts.timeRemaining = workDuration;
    ts.totalElapsed = 0;
    ts.pausedPhase = null;
    // Keep completedBlocks — reset only affects the current block
    forceRender();
  }, [workDuration, clearTimer, forceRender]);

  const ts = timerState.current;
  return {
    state: ts.state,
    currentRound: ts.currentRound,
    timeRemaining: ts.timeRemaining,
    totalElapsed: ts.totalElapsed,
    completedBlocks: ts.completedBlocks,
    start,
    pause,
    resume,
    reset,
    goAgain,
    setBlockDifficulty
  };
};

export default useIntervalTimer;
