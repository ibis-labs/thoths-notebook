"use client";

import React, { createContext, useContext, useReducer, useMemo } from 'react';
import type {
  ActiveSessionState,
  SessionAction,
  ExerciseLog,
  SetLog,
  WorkoutProgram,
  CardioLog,
  ProgramExercise,
  WorkoutSession,
} from '@/lib/khet-types';

// ─────────────────────────────────────────────────────────────
// Reducer
// ─────────────────────────────────────────────────────────────

const BLANK_SET: SetLog = { weight: 0, reps: 0, completed: false };

/**
 * Builds the initial set list for an exercise, seeding weights from the
 * most recent ghost session. Reps are left blank for the user to fill in.
 */
function buildInitialSets(
  exerciseId: string,
  setCount: number,
  ghostSessions: WorkoutSession[],
): SetLog[] {
  const mostRecent = ghostSessions[0];
  const prevLog = mostRecent?.exerciseLogs.find((e) => e.exerciseId === exerciseId);
  const prevCompleted = prevLog?.sets.filter((s) => s.completed) ?? [];

  return Array.from({ length: setCount }, (_, i) => ({
    // Use the matching set's weight if available, else fall back to the last completed set
    weight: prevCompleted[i]?.weight ?? prevCompleted[prevCompleted.length - 1]?.weight ?? 0,
    reps: 0,      // user fills in actual reps
    completed: false,
  }));
}

function sessionReducer(
  state: ActiveSessionState,
  action: SessionAction,
): ActiveSessionState {
  switch (action.type) {
    case 'UPDATE_SET': {
      const logs = [...state.exerciseLogs];
      const sets = [...logs[action.exerciseIdx].sets];
      sets[action.setIdx] = { ...sets[action.setIdx], ...action.updates };
      logs[action.exerciseIdx] = { ...logs[action.exerciseIdx], sets };
      return { ...state, exerciseLogs: logs };
    }
    case 'ADD_SET': {
      const logs = [...state.exerciseLogs];
      const existingSets = logs[action.exerciseIdx].sets;
      const lastSet = existingSets[existingSets.length - 1];
      // Inherit the last set's weight so the user only needs to adjust if needed
      const newSet: SetLog = { weight: lastSet?.weight ?? 0, reps: 0, completed: false };
      logs[action.exerciseIdx] = { ...logs[action.exerciseIdx], sets: [...existingSets, newSet] };
      return { ...state, exerciseLogs: logs };
    }
    case 'REMOVE_SET': {
      const logs = [...state.exerciseLogs];
      const sets = logs[action.exerciseIdx].sets;
      if (sets.length <= 1) return state;
      logs[action.exerciseIdx] = {
        ...logs[action.exerciseIdx],
        sets: sets.slice(0, -1),
      };
      return { ...state, exerciseLogs: logs };
    }
    case 'SWAP_EXERCISE': {
      const logs = [...state.exerciseLogs];
      const current = logs[action.exerciseIdx];
      logs[action.exerciseIdx] = {
        ...current,
        exerciseId: action.newExercise.exerciseId,
        name: action.newExercise.name,
        // Preserve original exercise identity so ghost log still shows prior history
        originalExerciseId: current.originalExerciseId ?? current.exerciseId,
        originalName: current.originalName ?? current.name,
        // Preserve existing sets count structure, reset weights/reps
        sets: current.sets.map(() => ({ ...BLANK_SET })),
      };
      return { ...state, exerciseLogs: logs };
    }
    case 'TOGGLE_CARDIO':
      return { ...state, cardioEnabled: !state.cardioEnabled };
    case 'SET_CARDIO':
      return {
        ...state,
        cardioLog: { ...state.cardioLog, ...action.log },
      };
    case 'TOGGLE_ABS':
      return { ...state, absEnabled: !state.absEnabled };
    case 'ADD_ABS_EXERCISE': {
      const newLog: ExerciseLog = {
        exerciseId: action.exercise.exerciseId,
        name: action.exercise.name,
        sets: [{ weight: 0, reps: 0, completed: false }],
      };
      return { ...state, absLogs: [...state.absLogs, newLog] };
    }
    case 'REMOVE_ABS_EXERCISE':
      return { ...state, absLogs: state.absLogs.filter((_, i) => i !== action.absIdx) };
    case 'UPDATE_ABS_SET': {
      const logs = [...state.absLogs];
      const sets = [...logs[action.absIdx].sets];
      sets[action.setIdx] = { ...sets[action.setIdx], ...action.updates };
      logs[action.absIdx] = { ...logs[action.absIdx], sets };
      return { ...state, absLogs: logs };
    }
    case 'ADD_ABS_SET': {
      const logs = [...state.absLogs];
      const existing = logs[action.absIdx].sets;
      const last = existing[existing.length - 1];
      logs[action.absIdx] = { ...logs[action.absIdx], sets: [...existing, { weight: last?.weight ?? 0, reps: 0, completed: false }] };
      return { ...state, absLogs: logs };
    }
    case 'REMOVE_ABS_SET': {
      const logs = [...state.absLogs];
      if (logs[action.absIdx].sets.length <= 1) return state;
      logs[action.absIdx] = { ...logs[action.absIdx], sets: logs[action.absIdx].sets.slice(0, -1) };
      return { ...state, absLogs: logs };
    }
    case 'SET_NOTES':
      return { ...state, notes: action.notes };
    case 'SET_EXERCISE_NOTES': {
      const logs = [...state.exerciseLogs];
      logs[action.exerciseIdx] = { ...logs[action.exerciseIdx], notes: action.notes };
      return { ...state, exerciseLogs: logs };
    }
    default:
      return state;
  }
}

// ─────────────────────────────────────────────────────────────
// Context type
// ─────────────────────────────────────────────────────────────

interface KhetSessionContextValue {
  state: ActiveSessionState;
  dispatch: React.Dispatch<SessionAction>;
  program: WorkoutProgram;
  dayIndex: number;
  totalVolume: number;
  anySetCompleted: boolean;
}

const KhetSessionContext = createContext<KhetSessionContextValue | null>(null);

// ─────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────

interface KhetSessionProviderProps {
  program: WorkoutProgram;
  dayIndex: number;
  ghostSessions: WorkoutSession[];
  children: React.ReactNode;
}

export function KhetSessionProvider({
  program,
  dayIndex,
  ghostSessions,
  children,
}: KhetSessionProviderProps) {
  const day = program.days[dayIndex];

  const initialState: ActiveSessionState = {
    exerciseLogs: day.exercises.map((ex: ProgramExercise): ExerciseLog => ({
      exerciseId: ex.exerciseId,
      name: ex.name,
      sets: buildInitialSets(ex.exerciseId, ex.sets, ghostSessions),
      notes: '',
    })),
    cardioEnabled: false,
    cardioLog: {
      type: 'Treadmill',
      duration: 0,
      distance: 0,
      calories: 0,
    },
    absEnabled: false,
    absLogs: [],
    notes: '',
    startDate: new Date().toISOString(),  // full timestamp, used to compute session duration
  };

  const [state, dispatch] = useReducer(sessionReducer, initialState);

  const totalVolume = useMemo(() => {
    return state.exerciseLogs.reduce((total, exLog) => {
      return (
        total +
        exLog.sets.reduce((setTotal, s) => {
          return s.completed ? setTotal + s.weight * s.reps : setTotal;
        }, 0)
      );
    }, 0);
  }, [state.exerciseLogs]);

  const anySetCompleted = useMemo(() => {
    return state.exerciseLogs.some((exLog) =>
      exLog.sets.some((s) => s.completed),
    );
  }, [state.exerciseLogs]);

  return (
    <KhetSessionContext.Provider
      value={{ state, dispatch, program, dayIndex, totalVolume, anySetCompleted }}
    >
      {children}
    </KhetSessionContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────

export function useKhetSession(): KhetSessionContextValue {
  const ctx = useContext(KhetSessionContext);
  if (!ctx) throw new Error('useKhetSession must be used within KhetSessionProvider');
  return ctx;
}
