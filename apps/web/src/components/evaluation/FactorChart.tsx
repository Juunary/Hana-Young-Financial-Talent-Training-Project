"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface FactorScore {
  factor_name: string;
  score_value: number;
  max_score: number;
  explanation: string;
}

interface FactorChartProps {
  factors: FactorScore[];
}

const FACTOR_LABELS: Record<string, string> = {
  academic: "학업 역량",
  project: "프로젝트",
  internship: "실무 경험",
  certification: "자격/인증",
  portfolio: "포트폴리오",
  github: "GitHub",
  consistency: "일관성",
};

function getBarColor(ratio: number): string {
  if (ratio >= 0.8) return "#1F9D6A";
  if (ratio >= 0.6) return "#4CB7A5";
  if (ratio >= 0.4) return "#C98A00";
  if (ratio >= 0.2) return "#D97706";
  return "#D9534F";
}

interface ChartDatum {
  name: string;
  score: number;
  max: number;
  ratio: number;
  explanation: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { payload: ChartDatum }[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="max-w-xs rounded-financial border border-border bg-card p-3 text-sm shadow-md">
      <p className="font-semibold text-foreground">{d.name}</p>
      <p className="text-muted-foreground mt-1">
        {d.score.toFixed(1)} / {d.max}점
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{d.explanation}</p>
    </div>
  );
}

export function FactorChart({ factors }: FactorChartProps) {
  const data: ChartDatum[] = factors.map((f) => ({
    name: FACTOR_LABELS[f.factor_name] ?? f.factor_name,
    score: f.score_value,
    max: f.max_score,
    ratio: f.max_score > 0 ? f.score_value / f.max_score : 0,
    explanation: f.explanation,
  }));

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 40, left: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
          <XAxis
            type="number"
            domain={[0, "dataMax"]}
            tick={{ fontSize: 11, fill: "#667572" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={70}
            tick={{ fontSize: 12, fill: "#2C3736" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F6F8F8" }} />
          <Bar dataKey="score" radius={[0, 4, 4, 0]} maxBarSize={24}>
            {data.map((entry, index) => (
              <Cell key={index} fill={getBarColor(entry.ratio)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {[
          { color: "#1F9D6A", label: "우수 (80%+)" },
          { color: "#4CB7A5", label: "양호 (60%+)" },
          { color: "#C98A00", label: "보통 (40%+)" },
          { color: "#D9534F", label: "미흡 (~40%)" },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
