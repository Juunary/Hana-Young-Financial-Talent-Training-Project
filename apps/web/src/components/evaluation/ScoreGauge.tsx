"use client";

interface ScoreGaugeProps {
  score: number; // 0-100
  grade: string;
  size?: number;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "#1F9D6A";
  if (score >= 60) return "#4CB7A5";
  if (score >= 40) return "#C98A00";
  if (score >= 20) return "#D97706";
  return "#D9534F";
}

function getGradeBg(score: number): string {
  if (score >= 80) return "bg-[#EAF7F4] text-[#1F9D6A]";
  if (score >= 60) return "bg-[#EAF7F4] text-[#4CB7A5]";
  if (score >= 40) return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-600";
}

export function ScoreGauge({ score, grade, size = 200 }: ScoreGaugeProps) {
  const radius = (size - 20) / 2;
  const cx = size / 2;
  const cy = size / 2;

  // Semicircle (180° arc) from left to right along the bottom
  const startAngle = -180;
  const endAngle = 0;
  const totalDeg = endAngle - startAngle; // 180
  const fillDeg = (score / 100) * totalDeg;

  function polarToXY(angleDeg: number, r: number) {
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  }

  function arcPath(fromDeg: number, toDeg: number, r: number) {
    const start = polarToXY(fromDeg, r);
    const end = polarToXY(toDeg, r);
    const largeArc = toDeg - fromDeg > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  }

  const trackPath = arcPath(startAngle, endAngle, radius);
  const fillPath = score > 0 ? arcPath(startAngle, startAngle + fillDeg, radius) : "";
  const color = getScoreColor(score);
  const strokeWidth = size * 0.09;

  return (
    <div className="flex flex-col items-center">
      <div style={{ width: size, height: size / 2 + 20 }} className="relative overflow-hidden">
        <svg width={size} height={size} className="absolute top-0 left-0">
          {/* Track */}
          <path
            d={trackPath}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Fill */}
          {fillPath && (
            <path
              d={fillPath}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          )}
        </svg>

        {/* Score text */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-end pb-2"
          style={{ top: size * 0.2 }}
        >
          <span className="text-4xl font-bold tabular-nums" style={{ color }}>
            {Math.round(score)}
          </span>
          <span className="text-neutral-500 text-sm">/100</span>
        </div>
      </div>

      {/* Grade badge */}
      <span
        className={`mt-2 inline-flex items-center rounded-full px-3 py-1 text-sm font-bold ${getGradeBg(score)}`}
      >
        {grade}등급
      </span>
    </div>
  );
}
