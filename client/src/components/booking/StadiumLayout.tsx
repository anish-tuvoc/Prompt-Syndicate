import { motion } from "framer-motion";
import type { StadiumBlock, StadiumTier } from "../../pages/BookingPage/type";

interface StadiumLayoutProps {
  blocks: StadiumBlock[];
  selectedBlockId: string | null;
  highlightTier: string | null;
  onSelectBlock: (id: string) => void;
}

const CX = 210;
const CY = 210;

const TIER_COLORS: Record<StadiumTier, string> = {
  vip:      "#F59E0B",
  premium:  "#8B5CF6",
  standard: "#3B82F6",
  budget:   "#22C55E",
};

const SELECTED_COLOR = "#10B981";

function toRad(clockDeg: number): number {
  return ((clockDeg - 90) * Math.PI) / 180;
}

function describeArc(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startDeg: number,
  endDeg: number,
): string {
  const x1 = cx + innerR * Math.cos(toRad(startDeg));
  const y1 = cy + innerR * Math.sin(toRad(startDeg));
  const x2 = cx + innerR * Math.cos(toRad(endDeg));
  const y2 = cy + innerR * Math.sin(toRad(endDeg));
  const x3 = cx + outerR * Math.cos(toRad(endDeg));
  const y3 = cy + outerR * Math.sin(toRad(endDeg));
  const x4 = cx + outerR * Math.cos(toRad(startDeg));
  const y4 = cy + outerR * Math.sin(toRad(startDeg));
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return [
    `M${x1.toFixed(2)},${y1.toFixed(2)}`,
    `A${innerR},${innerR},0,${large},1,${x2.toFixed(2)},${y2.toFixed(2)}`,
    `L${x3.toFixed(2)},${y3.toFixed(2)}`,
    `A${outerR},${outerR},0,${large},0,${x4.toFixed(2)},${y4.toFixed(2)}`,
    "Z",
  ].join(" ");
}

function arcLabelPos(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startDeg: number,
  endDeg: number,
): { x: number; y: number } {
  const midDeg = (startDeg + endDeg) / 2;
  const midR = (innerR + outerR) / 2;
  return {
    x: cx + midR * Math.cos(toRad(midDeg)),
    y: cy + midR * Math.sin(toRad(midDeg)),
  };
}

export function StadiumLayout({ blocks, selectedBlockId, highlightTier, onSelectBlock }: StadiumLayoutProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-xs text-slate-400">
        Click a section to select &middot; Hover to preview
      </p>
      <svg
        viewBox="0 0 420 420"
        className="w-full max-w-[420px]"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Pitch background */}
        <ellipse cx={CX} cy={CY} rx={46} ry={40} fill="#16A34A" />
        {/* Boundary */}
        <ellipse cx={CX} cy={CY} rx={52} ry={46} fill="none" stroke="#22C55E" strokeWidth="1" strokeDasharray="3,3" />
        {/* Pitch strip */}
        <rect x={CX - 6} y={CY - 20} width={12} height={40} rx={2} fill="#A16207" opacity={0.85} />
        {/* Centre wicket dots */}
        <circle cx={CX} cy={CY - 18} r={2} fill="#FCD34D" />
        <circle cx={CX} cy={CY + 18} r={2} fill="#FCD34D" />
        {/* GROUND label */}
        <text
          x={CX}
          y={CY + 5}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="7"
          fontWeight="bold"
          fill="rgba(255,255,255,0.6)"
          letterSpacing="2"
        >
          GROUND
        </text>

        {/* Stadium blocks */}
        {blocks.map((block) => {
          const isSelected = block.id === selectedBlockId;
          const isHighlighted = highlightTier === block.priceId;
          const fill = isSelected ? SELECTED_COLOR : TIER_COLORS[block.tier];
          const opacity = isSelected ? 1 : isHighlighted ? 0.92 : 0.65;
          const path = describeArc(CX, CY, block.innerRadius, block.outerRadius, block.startAngle, block.endAngle);
          const labelPos = arcLabelPos(CX, CY, block.innerRadius, block.outerRadius, block.startAngle, block.endAngle);
          const spanDeg = block.endAngle - block.startAngle;
          const showLabel = spanDeg > 12;

          return (
            <g key={block.id} className="cursor-pointer" onClick={() => onSelectBlock(block.id)}>
              <motion.path
                d={path}
                fill={fill}
                stroke="rgba(0,0,0,0.45)"
                strokeWidth={isSelected ? 2 : 1}
                animate={{ opacity, fill }}
                whileHover={{ opacity: 1, filter: "brightness(1.25)" }}
                transition={{ duration: 0.18 }}
                style={{ cursor: "pointer" }}
              />
              {showLabel && (
                <text
                  x={labelPos.x.toFixed(2)}
                  y={labelPos.y.toFixed(2)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={block.tier === "vip" ? "7.5" : "6.5"}
                  fontWeight="bold"
                  fill="rgba(255,255,255,0.9)"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {block.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
