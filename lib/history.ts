"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";

const DEFAULT_LIMIT = 10;

type HistoryState<T> = {
  past: T[];
  present: T;
  future: T[];
};

type HistoryAction<T> =
  | { type: "replace"; value: T }
  | { type: "commit"; from: T; to: T }
  | { type: "undo" }
  | { type: "redo" };

function same<T>(a: T, b: T): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function createReducer<T>(limit: number) {
  return function reducer(
    state: HistoryState<T>,
    action: HistoryAction<T>,
  ): HistoryState<T> {
    switch (action.type) {
      case "replace":
        if (same(state.present, action.value)) return state;
        return { ...state, present: action.value };

      case "commit": {
        if (same(action.from, action.to)) return state;
        return {
          past: [...state.past, action.from].slice(-limit),
          present: action.to,
          future: [],
        };
      }

      case "undo": {
        if (state.past.length === 0) return state;
        const previous = state.past[state.past.length - 1];
        return {
          past: state.past.slice(0, -1),
          present: previous,
          future: [state.present, ...state.future],
        };
      }

      case "redo": {
        if (state.future.length === 0) return state;
        const next = state.future[0];
        return {
          past: [...state.past, state.present].slice(-limit),
          present: next,
          future: state.future.slice(1),
        };
      }

      default:
        return state;
    }
  };
}

/**
 * Undo/redo (max `limit` steps). Use `{ coalesce: true }` while dragging so a
 * gesture becomes a single history entry after idle / on the next hard set.
 */
export function useUndoableState<T>(
  initial: T,
  options?: { limit?: number; coalesceMs?: number },
) {
  const limit = options?.limit ?? DEFAULT_LIMIT;
  const coalesceMs = options?.coalesceMs ?? 400;
  const reducer = useMemo(() => createReducer<T>(limit), [limit]);

  const [state, dispatch] = useReducer(reducer, {
    past: [] as T[],
    present: initial,
    future: [] as T[],
  });

  const presentRef = useRef(state.present);
  const anchorRef = useRef<T | null>(null);
  const timerRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    presentRef.current = state.present;
  }, [state.present]);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const flushCoalesce = useCallback(() => {
    clearTimer();
    const from = anchorRef.current;
    if (from === null) return;
    anchorRef.current = null;
    const to = presentRef.current;
    if (!same(from, to)) {
      dispatch({ type: "commit", from, to });
    }
  }, [clearTimer]);

  const set = useCallback(
    (value: T | ((prev: T) => T), opts?: { coalesce?: boolean }) => {
      const prev = presentRef.current;
      const next =
        typeof value === "function" ? (value as (p: T) => T)(prev) : value;
      if (same(prev, next)) return;

      if (opts?.coalesce) {
        if (anchorRef.current === null) {
          anchorRef.current = prev;
        }
        presentRef.current = next;
        dispatch({ type: "replace", value: next });
        clearTimer();
        timerRef.current = window.setTimeout(() => {
          flushCoalesce();
        }, coalesceMs);
        return;
      }

      clearTimer();
      const anchor = anchorRef.current;
      anchorRef.current = null;
      if (anchor !== null && !same(anchor, prev)) {
        dispatch({ type: "commit", from: anchor, to: prev });
      }
      presentRef.current = next;
      dispatch({ type: "commit", from: prev, to: next });
    },
    [clearTimer, coalesceMs, flushCoalesce],
  );

  const undo = useCallback(() => {
    flushCoalesce();
    dispatch({ type: "undo" });
  }, [flushCoalesce]);

  const redo = useCallback(() => {
    flushCoalesce();
    dispatch({ type: "redo" });
  }, [flushCoalesce]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.isComposing) return;
      const mod = event.metaKey || event.ctrlKey;
      if (!mod || event.key.toLowerCase() !== "z") return;
      event.preventDefault();
      if (event.shiftKey) {
        redo();
      } else {
        undo();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  return {
    state: state.present,
    set,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}
