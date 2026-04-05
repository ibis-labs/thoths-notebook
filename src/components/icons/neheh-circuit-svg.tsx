"use client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
import raw from "@/data/NehehCircuitSVGData.json";

export type IndicatorState = "active" | "missed" | "unlit";

export interface NehehCircuitSvgProps {
  /** 10 states for decan indicators (index 0=day1 to 9=day10).
   *  active=green, missed=red, unlit=dark */
  decanStates?: IndicatorState[];
  /** 7 states for iris indicators. active=purple, unlit=dim */
  irisStates?: IndicatorState[];
  /** 1 outer-ring indicator. active=red */
  outerRingState?: IndicatorState;
  /** 1 outermost-ring indicator. active=cyan */
  outermostRingState?: IndicatorState;
  size?: number;
  className?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const D = raw as any;

// Structural paths are in SVG mm user-unit space (viewBox "0 0 210 297").
// Indicator paths (g17) are in Inkscape px units; scale by 1/3.7795275591
// to map them into the same mm coordinate space.
const IND_SCALE = 0.26458333;

const IRIS_DETAILS: string[] = Array.from({ length: 12 }, (_, i) =>
  D.structural[`iris-detail-${i + 1}`]
).filter(Boolean);

const INNER_BITS: string[] = ["inner-bit-1", "inner-bit-2", "inner-bit-3", "inner-bit-4", "inner-bit-7"]
  .map((k: string) => D.structural[k])
  .filter(Boolean);

const DECAN_TICKS: string[] = Array.from({ length: 10 }, (_, i) =>
  D.structural[`decan-tick-${i + 1}`]
).filter(Boolean);

const ALL_RIBS: string[] = [
  ...Array.from({ length: 9 }, (_, i) => D.structural[`decan-bar-ribs-left-upper-${i}`]),
  ...Array.from({ length: 9 }, (_, i) => D.structural[`decan-bar-ribs-left-lower-${i}`]),
  ...Array.from({ length: 9 }, (_, i) => D.structural[`decan-bar-ribs-right-upper-${i}`]),
  ...Array.from({ length: 9 }, (_, i) => D.structural[`decan-bar-ribs-right-lower-${i}`]),
].filter(Boolean);

const DECAN_INDS: string[] = Array.from({ length: 10 }, (_, i) =>
  D.indicators[`decan-indicator-${i + 1}`]
);
const IRIS_INDS: string[] = Array.from({ length: 7 }, (_, i) =>
  D.indicators[`iris-indicator-${i + 1}`]
);
const OUTER_RING_IND: string = D.indicators["outer-ring-indicator"];
const OUTERMOST_IND:  string = D.indicators["outermost-ring-indicator"];

export function NehehCircuitSvg({
  decanStates        = Array(10).fill("unlit") as IndicatorState[],
  irisStates         = Array(7).fill("unlit")  as IndicatorState[],
  outerRingState     = "unlit",
  outermostRingState = "unlit",
  size      = 400,
  className = "",
}: NehehCircuitSvgProps) {
  // viewBox crops to the design area in mm space: x 46-168, y 95-205
  const vbW = 122, vbH = 110;
  const height = Math.round(size * vbH / vbW);

  return (
    <svg
      viewBox={`46 95 ${vbW} ${vbH}`}
      width={size}
      height={height}
      className={className}
      aria-label="Neheh-Circuit — Shen Ring of Commitment"
      style={{ overflow: "visible" }}
    >
      <defs>
        {/* Structural filters — stdDeviation in mm units */}
        <filter id="nhc-s-cyan" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="blur" />
          <feFlood floodColor="#22d3ee" floodOpacity="0.6" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="nhc-s-purple" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.0" result="blur" />
          <feFlood floodColor="#a855f7" floodOpacity="0.6" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="nhc-s-amber" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.9" result="blur" />
          <feFlood floodColor="#f59e0b" floodOpacity="0.6" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        {/* Indicator filters — stdDeviation in Inkscape px units (inside scale group) */}
        <filter id="nhc-green" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
          <feFlood floodColor="#39FF14" floodOpacity="0.7" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="nhc-red" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
          <feFlood floodColor="#f87171" floodOpacity="0.7" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="nhc-purple" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
          <feFlood floodColor="#c084fc" floodOpacity="0.65" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="nhc-cyan" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
          <feFlood floodColor="#22d3ee" floodOpacity="0.7" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* STRUCTURAL ELEMENTS (mm coordinate space) */}

      {/* Outer rings */}
      <path d={D.structural["outer-ring-1"]}
        fill="rgba(6,182,212,0.04)" stroke="#22d3ee" strokeWidth="0.45"
        filter="url(#nhc-s-cyan)">
        <animate attributeName="opacity" values="0.55;0.95;0.55" dur="4s" repeatCount="indefinite" />
      </path>
      <path d={D.structural["outer-ring-2"]}
        fill="none" stroke="#0891b2" strokeWidth="0.3" opacity="0.5" />

      {/* Iris rings */}
      <path d={D.structural["iris-outer"]}
        fill="none" stroke="#a855f7" strokeWidth="0.5"
        filter="url(#nhc-s-purple)">
        <animate attributeName="opacity" values="0.65;1;0.65" dur="3s" repeatCount="indefinite" />
      </path>
      <path d={D.structural["iris-inner"]}
        fill="none" stroke="#22d3ee" strokeWidth="0.45"
        filter="url(#nhc-s-cyan)" opacity="1" />

      {/* Iris hieroglyph details — cyber-feather style: black fill, cyan/50 border, subtle cyan glow */}
      {IRIS_DETAILS.map((d: string, i: number) => (
        <path key={i} d={d}
          fill="#001a22"
          stroke="#22d3ee"
          strokeWidth="0.14"
          opacity="1"
          filter="url(#nhc-s-cyan)"
        />
      ))}

      {/* Bits outside iris — slight translate from original SVG group */}
      <g transform="translate(-0.37417734,1.8708867)">
        {INNER_BITS.map((d: string, i: number) => (
          <path key={i} d={d}
            fill="rgba(34,211,238,0.25)" stroke="#22d3ee" strokeWidth="0.18" opacity="0.75" />
        ))}
      </g>

      {/* Ankh */}
      <path d={D.structural["ankh-circuit"]}
        fill="rgba(245,158,11,0.08)" stroke="#f59e0b" strokeWidth="0.45"
        filter="url(#nhc-s-amber)">
        <animate attributeName="opacity" values="0.5;0.95;0.5" dur="3.5s" repeatCount="indefinite" />
      </path>
      <path d={D.structural["ankh"]}
        fill="#f59e0b" opacity="0.88" filter="url(#nhc-s-amber)" />

      {/* Decan bar */}
      <path d={D.structural["decan-bar-outline"]}
        fill="none" stroke="#f59e0b" strokeWidth="0.55"
        filter="url(#nhc-s-amber)" opacity="1" />
      {DECAN_TICKS.map((d: string, i: number) => (
        <path key={i} d={d} fill="#0c1626" stroke="#1e3a5f" strokeWidth="0.25" />
      ))}
      {ALL_RIBS.map((d: string, i: number) => (
        <path key={i} d={d}
          fill="none"
          stroke="#22d3ee"
          strokeWidth="0.5"
        >
          {/* Harp arpeggio — all ribs share the same dur so the wave resyncs cleanly */}
          <animate
            attributeName="opacity"
            values="0.15;1;0.15"
            dur="3.6s"
            begin={`${i * 0.1}s`}
            repeatCount="indefinite"
          />
        </path>
      ))}

      {/* INDICATORS — px space scaled to mm */}
      <g transform={`scale(${IND_SCALE})`}>

        {DECAN_INDS.map((d: string, i: number) => {
          const state = decanStates[i] ?? "unlit";
          const isActive = state === "active";
          const isMissed = state === "missed";
          return (
            <path key={i} d={d}
              fill={isActive ? "#39FF14" : isMissed ? "#f87171" : "#071207"}
              opacity={state === "unlit" ? 0.25 : 0.9}
              filter={isActive ? "url(#nhc-green)" : isMissed ? "url(#nhc-red)" : undefined}
            />
          );
        })}

        {IRIS_INDS.map((d: string, i: number) => {
          const state = irisStates[i] ?? "unlit";
          const isActive = state === "active";
          return (
            <path key={i} d={d}
              fill={isActive ? "#c084fc" : "#140a1e"}
              opacity={isActive ? 0.85 : 0.15}
              filter={isActive ? "url(#nhc-purple)" : undefined}
            />
          );
        })}

        <path d={OUTER_RING_IND}
          fill={outerRingState === "active" ? "#f87171" : "#1a0000"}
          opacity={outerRingState === "active" ? 0.85 : 0.1}
          filter={outerRingState === "active" ? "url(#nhc-red)" : undefined}
        />

        <path d={OUTERMOST_IND}
          fill={outermostRingState === "active" ? "#22d3ee" : "#001519"}
          opacity={outermostRingState === "active" ? 0.85 : 0.08}
          filter={outermostRingState === "active" ? "url(#nhc-cyan)" : undefined}
        />

      </g>
    </svg>
  );
}
