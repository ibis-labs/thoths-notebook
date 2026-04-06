'use client';

import { cn } from '@/lib/utils';

interface IphtyLinkIconProps extends React.SVGProps<SVGSVGElement> {
  /** When true the node circle fills fuchsia and pulses */
  nodeActive?: boolean;
}

/**
 * The custom Iphty Link icon drawn in Inkscape.
 *
 * viewBox: 0 0 23.60128 7.3066278  (~3.2:1 aspect)
 * The layer group carries a translate(-118.02321,-176.21875) offset so all
 * path coordinates are in absolute Inkscape space — we keep it verbatim.
 *
 * Paths:
 *   rect1       — enclosure bar (stroke only)
 *   path1       — antenna arc bridge (stroke only)
 *   path2/3     — antenna diagonals (filled)
 *   path4/node  — small circle orb  ← notification indicator
 *   path5/6     — circuit traces left/right (filled)
 */
export function IphtyLinkIcon({ nodeActive = false, className, ...props }: IphtyLinkIconProps) {
  return (
    <svg
      viewBox="0 0 23.60128 7.3066278"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      aria-hidden="true"
      className={cn('overflow-visible', className)}
      {...props}
    >
      <g transform="translate(-118.02321,-176.21875)">

        {/* enclosure bar ─ stroke only */}
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="0.253279"
          strokeLinecap="square"
          d="m 118.24865,179.38347 h 23.15041 c 0.0547,0 0.0988,0.044 0.0988,0.0988 v 3.81766 c 0,0.0547 -0.0441,0.0988 -0.0988,0.0988 h -23.15041 c -0.0547,0 -0.0988,-0.0441 -0.0988,-0.0988 v -3.81766 c 0,-0.0547 0.0441,-0.0988 0.0988,-0.0988 z"
        />

        {/* antenna arc bridge ─ stroke only */}
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="0.270999"
          strokeLinecap="square"
          transform="scale(1,-1)"
          d="m 132.09273,-179.3494 a 2.1954808,2.1954808 0 0 1 -1.09774,1.90135 2.1954808,2.1954808 0 0 1 -2.19548,0 2.1954808,2.1954808 0 0 1 -1.09774,-1.90135"
        />

        {/* antenna right diagonal ─ filled solid */}
        <path d="m 135.19336,176.21875 -0.0996,0.0937 -3.12109,2.95508 -0.0977,0.0918 0.18555,0.13383 0.0976,-0.0303 3.12305,-2.95312 0.0977,-0.0937 z" />

        {/* antenna left diagonal ─ filled solid */}
        <path d="m 124.5293,176.21875 -0.18555,0.19727 0.0977,0.0937 3.12304,2.95312 0.0977,0.0405 0.18555,-0.14406 -0.0977,-0.0918 -3.12109,-2.95508 z" />

        {/* ─── NODE CIRCLE ─── the notification orb ─────────────────────── */}
        <path
          fill={nodeActive ? 'rgb(232,121,249)' : 'none'}
          stroke={nodeActive ? 'rgb(232,121,249)' : 'currentColor'}
          strokeWidth="0.270999"
          strokeLinecap="square"
          className={nodeActive ? 'iphty-node-active' : undefined}
          d="m 125.11326,181.45178 c 0,0.4794 -0.38863,0.86803 -0.86803,0.86803 -0.4794,0 -0.86803,-0.38863 -0.86803,-0.86803 0,-0.4794 0.38863,-0.86803 0.86803,-0.86803 0.4794,0 0.86803,0.38863 0.86803,0.86803 z"
        />

        {/* circuit trace left ─ filled solid */}
        <path d="m 118.17517,179.29667 -0.0871,0.13924 -0.0295,0.0289 1.94949,2.18319 h 3.29343 0.13477 v -0.27149 h -0.13477 -3.18015 l -1.87136,-2.1031 z" />

        {/* circuit trace right ─ filled solid */}
        <path d="m 125.03837,181.39844 v 0.27148 h 0.13477 14.37764 l 1.78516,1.7832 0.0898,0.0455 0.1619,-0.14419 -0.0603,-0.0927 -1.86328,-1.86328 h -14.49092 z" />

      </g>
    </svg>
  );
}
