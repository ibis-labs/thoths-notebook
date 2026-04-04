"use client";

import { useMemo } from "react";
import { PromotionTier } from "@/lib/neheh-circuit";

// ─── GEOMETRY CONSTANTS ───────────────────────────────────────────────────────
// Circle: center (100, 96), main ring r=70
// Inner guide ring: r=54
// Hour tick radii: inner=58, outer=65 (between inner guide and main ring)
// Shen base: struts from circle at ~210° and ~150° CW-from-12, down to rope at y=197

const CX = 100;
const CY = 96;
const R  = 70;
const CIRCUMFERENCE = 2 * Math.PI * R; // ≈ 439.82

// Pre-compute 12 hour tick positions (clockwise from 12-o'clock)
// For CW-from-12: x = cx + r*sin(θ), y = cy - r*cos(θ)
const TICK_POSITIONS = Array.from({ length: 12 }, (_, k) => {
  const theta = k * (Math.PI / 6); // 30° steps
  const sinT  = Math.sin(theta);
  const cosT  = Math.cos(theta);
  return {
    x1: CX + 58 * sinT,
    y1: CY - 58 * cosT,
    x2: CX + 65 * sinT,
    y2: CY - 65 * cosT,
  };
});

// Shen rope base geometry (computed from θ=210° and θ=150° on the circle)
// θ=210° CW-from-12: sin(210°)=-0.5, cos(210°)=-0.866 → x=65, y=156.6 (lower-left departure)
// θ=150° CW-from-12: sin(150°)=0.5,  cos(150°)=-0.866 → x=135, y=156.6 (lower-right departure)
const LEFT_X  = 65;
const RIGHT_X = 135;
const DEPART_Y = 157;
const BASE_Y  = 197;
const BASE_L  = 31;
const BASE_R  = 169;

// ─── PHASE COLOR HELPER ───────────────────────────────────────────────────────
function phaseColor(day: number): { ring: string; glow: string } {
  if (day === 0)        return { ring: '#1e3a5f', glow: 'rgba(30,58,95,0)' };
  if (day <= 11)        return { ring: '#f59e0b', glow: 'rgba(245,158,11,0.65)' };
  if (day <= 29)        return { ring: '#fb923c', glow: 'rgba(251,146,60,0.65)' };
  if (day <= 69)        return { ring: '#f97316', glow: 'rgba(249,115,22,0.65)' };
  if (day <= 119)       return { ring: '#a855f7', glow: 'rgba(168,85,247,0.65)' };
  if (day <= 359)       return { ring: '#22d3ee', glow: 'rgba(34,211,238,0.65)' };
  /* day === 360 */     return { ring: '#ffffff', glow: 'rgba(255,255,255,0.85)' };
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
interface ShenRingProps {
  effectiveDay: number; // 0–360
  tier?: PromotionTier;
  size?: number;        // pixel size of the rendered SVG width
  className?: string;
}

export function ShenRing({ effectiveDay, size = 200, className = '' }: ShenRingProps) {
  const day     = Math.max(0, Math.min(360, Math.floor(effectiveDay)));
  const progress   = day / 360;
  const dashOffset = CIRCUMFERENCE * (1 - progress);
  const colors     = phaseColor(day);
  const activeTicks = Math.min(day, 12);
  const isTranscendent = day === 360;

  // The base rope inherits the phase color when active, dim when dormant
  const baseColor  = day > 0 ? colors.ring : '#1e3a5f';
  const baseOpacity = day > 0 ? 0.65 : 0.25;

  return (
    <svg
      viewBox="0 0 200 210"
      width={size}
      height={Math.round(size * 1.05)}
      className={className}
      aria-label={`Neheh-Circuit: Day ${day} of 360`}
    >
      <defs>
        {/* Glow for the arc and base */}
        <filter id="shen-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Softer glow for ticks */}
        <filter id="shen-tick-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="1.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Extra halo for transcendent state */}
        {isTranscendent && (
          <filter id="shen-halo" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      {/* ── Transcendent outer halo ── */}
      {isTranscendent && (
        <circle
          cx={CX} cy={CY} r={R + 10}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="18"
          fill="none"
          filter="url(#shen-halo)"
        />
      )}

      {/* ── Track circle (dim background of the main ring) ── */}
      <circle
        cx={CX} cy={CY} r={R}
        stroke="#0f172a"
        strokeWidth="6"
        fill="none"
      />

      {/* ── Inner decorative guide ring ── */}
      <circle
        cx={CX} cy={CY} r={54}
        stroke="#0f172a"
        strokeWidth="1"
        fill="none"
      />

      {/* ── Progress arc (fills clockwise from 12-o'clock) ── */}
      {day > 0 && (
        <circle
          cx={CX} cy={CY} r={R}
          stroke={colors.ring}
          strokeWidth="6"
          fill="none"
          strokeDasharray={`${CIRCUMFERENCE}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${CX} ${CY})`}
          filter="url(#shen-glow)"
          style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1), stroke 0.8s ease' }}
        />
      )}

      {/* ── 12 Hour tick marks ── */}
      {TICK_POSITIONS.map((tick, k) => {
        const isActive = k < activeTicks;
        return (
          <line
            key={k}
            x1={tick.x1} y1={tick.y1}
            x2={tick.x2} y2={tick.y2}
            stroke={isActive ? colors.ring : '#1e293b'}
            strokeWidth={isActive ? "2.5" : "1.5"}
            strokeLinecap="round"
            filter={isActive ? "url(#shen-tick-glow)" : undefined}
            style={isActive ? { transition: 'stroke 0.6s ease' } : undefined}
          />
        );
      })}

      {/* ── Center: day number and label ── */}
      <text
        x={CX} y={CY - 4}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={day > 0 ? colors.ring : '#334155'}
        fontSize="22"
        fontFamily="monospace"
        fontWeight="bold"
        style={{ transition: 'fill 0.8s ease' }}
      >
        {day}
      </text>
      <text
        x={CX} y={CY + 16}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#334155"
        fontSize="7"
        fontFamily="monospace"
        letterSpacing="2"
      >
        OF 360
      </text>

      {/* ── Shen rope base ── */}
      {/* Left strut */}
      <line
        x1={LEFT_X}  y1={DEPART_Y}
        x2={BASE_L}  y2={BASE_Y}
        stroke={baseColor}
        strokeWidth="4"
        strokeLinecap="round"
        opacity={baseOpacity}
        filter={day > 0 ? "url(#shen-glow)" : undefined}
      />
      {/* Right strut */}
      <line
        x1={RIGHT_X} y1={DEPART_Y}
        x2={BASE_R}  y2={BASE_Y}
        stroke={baseColor}
        strokeWidth="4"
        strokeLinecap="round"
        opacity={baseOpacity}
        filter={day > 0 ? "url(#shen-glow)" : undefined}
      />
      {/* Horizontal rope bar */}
      <line
        x1={BASE_L} y1={BASE_Y}
        x2={BASE_R} y2={BASE_Y}
        stroke={baseColor}
        strokeWidth="4"
        strokeLinecap="round"
        opacity={baseOpacity}
        filter={day > 0 ? "url(#shen-glow)" : undefined}
      />
      {/* Rope end caps */}
      <circle cx={BASE_L} cy={BASE_Y} r={4} fill={baseColor} opacity={baseOpacity + 0.1} />
      <circle cx={BASE_R} cy={BASE_Y} r={4} fill={baseColor} opacity={baseOpacity + 0.1} />
    </svg>
  );
}
