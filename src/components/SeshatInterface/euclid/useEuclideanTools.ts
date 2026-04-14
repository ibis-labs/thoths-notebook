"use client";

import { useCallback, useMemo, useReducer, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export interface Point { id: number; x: number; y: number }
export interface Line  { id: number; a: Point; b: Point }
export interface Circle { id: number; cx: number; cy: number; r: number }

export type Tool = "point" | "line" | "circle";

interface State {
  points:  Point[];
  lines:   Line[];
  circles: Circle[];
  nextId:  number;
  pendingLineStart: Point | null;
  pendingCircleCenter: Point | null;
}

const init: State = {
  points: [], lines: [], circles: [],
  nextId: 1,
  pendingLineStart: null,
  pendingCircleCenter: null,
};

type Action =
  | { type: "ADD_POINT"; x: number; y: number }
  | { type: "COMPLETE_LINE"; to: Point }
  | { type: "CANCEL_PENDING" }
  | { type: "COMPLETE_CIRCLE"; to: { x: number; y: number } }
  | { type: "RESET" };

function dist(ax: number, ay: number, bx: number, by: number) {
  return Math.hypot(bx - ax, by - ay);
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_POINT": {
      const id = state.nextId;
      const pt: Point = { id, x: action.x, y: action.y };
      if (state.pendingLineStart) {
        // second tap for line
        const line: Line = { id: id + 1, a: state.pendingLineStart, b: pt };
        return {
          ...state,
          points: [...state.points, pt],
          lines: [...state.lines, line],
          nextId: id + 2,
          pendingLineStart: null,
        };
      }
      if (state.pendingCircleCenter) {
        const r = dist(state.pendingCircleCenter.x, state.pendingCircleCenter.y, action.x, action.y);
        const circle: Circle = { id: id + 1, cx: state.pendingCircleCenter.x, cy: state.pendingCircleCenter.y, r };
        return {
          ...state,
          points: [...state.points, pt],
          circles: [...state.circles, circle],
          nextId: id + 2,
          pendingCircleCenter: null,
        };
      }
      return { ...state, points: [...state.points, pt], nextId: id + 1 };
    }
    case "COMPLETE_LINE": {
      if (!state.pendingLineStart) return state;
      const id = state.nextId;
      const line: Line = { id, a: state.pendingLineStart, b: action.to };
      return {
        ...state,
        lines: [...state.lines, line],
        nextId: id + 1,
        pendingLineStart: null,
      };
    }
    case "COMPLETE_CIRCLE": {
      if (!state.pendingCircleCenter) return state;
      const id = state.nextId;
      const r = dist(state.pendingCircleCenter.x, state.pendingCircleCenter.y, action.to.x, action.to.y);
      const circle: Circle = { id, cx: state.pendingCircleCenter.x, cy: state.pendingCircleCenter.y, r };
      return {
        ...state,
        circles: [...state.circles, circle],
        nextId: id + 1,
        pendingCircleCenter: null,
      };
    }
    case "CANCEL_PENDING":
      return { ...state, pendingLineStart: null, pendingCircleCenter: null };
    case "RESET":
      return { ...init };
    default:
      return state;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Snap utility — returns the nearest existing point within threshold, or null
// ─────────────────────────────────────────────────────────────────────────────
export function snapToNearest(
  x: number, y: number,
  points: Point[],
  threshold = 22
): Point | null {
  let best: Point | null = null;
  let bestDist = threshold;
  for (const p of points) {
    const d = dist(x, y, p.x, p.y);
    if (d < bestDist) { bestDist = d; best = p; }
  }
  return best;
}

// ─────────────────────────────────────────────────────────────────────────────
// Circle-circle intersection (Book I constructions need this)
// ─────────────────────────────────────────────────────────────────────────────
export function circleCircleIntersections(
  c1: Circle, c2: Circle
): [Point, Point] | null {
  const dx = c2.cx - c1.cx;
  const dy = c2.cy - c1.cy;
  const d = Math.hypot(dx, dy);
  if (d > c1.r + c2.r || d < Math.abs(c1.r - c2.r) || d === 0) return null;
  const a = (c1.r ** 2 - c2.r ** 2 + d ** 2) / (2 * d);
  const h = Math.sqrt(Math.max(0, c1.r ** 2 - a ** 2));
  const mx = c1.cx + (a * dx) / d;
  const my = c1.cy + (a * dy) / d;
  return [
    { id: -1, x: mx + (h * dy) / d, y: my - (h * dx) / d },
    { id: -2, x: mx - (h * dy) / d, y: my + (h * dx) / d },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────
export function useEuclideanTools(tool: Tool) {
  const [state, dispatch] = useReducer(reducer, init);
  const toolRef = useRef(tool);
  toolRef.current = tool;

  // All virtual points: constructed + circle-circle intersections
  const allSnappable: Point[] = useMemo(() => {
    const pts = [...state.points];
    for (let i = 0; i < state.circles.length; i++) {
      for (let j = i + 1; j < state.circles.length; j++) {
        const ixs = circleCircleIntersections(state.circles[i], state.circles[j]);
        if (ixs) pts.push(...ixs);
      }
    }
    return pts;
  }, [state.points, state.circles]);

  const tap = useCallback((rawX: number, rawY: number) => {
    const snapped = snapToNearest(rawX, rawY, allSnappable);
    const x = snapped?.x ?? rawX;
    const y = snapped?.y ?? rawY;
    const t = toolRef.current;

    if (t === "point") {
      dispatch({ type: "ADD_POINT", x, y });
    } else if (t === "line") {
      if (!state.pendingLineStart) {
        // first tap — sets the start point and adds it as a point
        const pt: Point = snapped ?? { id: state.nextId, x, y };
        if (!snapped) dispatch({ type: "ADD_POINT", x, y });
        // store pending via a synthetic state write
        dispatch({ type: "ADD_POINT", x: pt.x - 0.001, y: pt.y - 0.001 }); // noop point trick
        // Better: set pending directly
      } else {
        dispatch({ type: "COMPLETE_LINE", to: { id: state.nextId, x, y } });
        if (!snapped) dispatch({ type: "ADD_POINT", x, y });
      }
    } else if (t === "circle") {
      dispatch({ type: "ADD_POINT", x, y }); // ADD_POINT handles circle pending state
    }
  }, [allSnappable, state.pendingLineStart, state.nextId]);

  const tapClean = useCallback((rawX: number, rawY: number) => {
    const snapped = snapToNearest(rawX, rawY, allSnappable);
    const x = snapped?.x ?? rawX;
    const y = snapped?.y ?? rawY;
    dispatch({ type: "ADD_POINT", x, y });
  }, [allSnappable]);

  return {
    state,
    allSnappable,
    dispatch,
    tapClean,
  };
}
