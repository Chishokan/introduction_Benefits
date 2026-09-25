"use client";

import { useState } from "react";

type Point = { month: string; label: string; count: number };

const W = 1000; // 全幅表示で文字・棒が大きくなりすぎない幅
const H = 220;
const PAD = { top: 20, right: 12, bottom: 28, left: 36 };
const BAR = "#0b5aa6"; // brand-600（コントラスト・彩度をバリデータで確認済み）
const BAR_HOVER = "#094a8a";
const GRID = "#e2e8f0";

// 0 から始まるきりの良い目盛り
function ticks(max: number): number[] {
  if (max <= 4) return [0, 1, 2, 3, 4];
  const step = [1, 2, 5, 10, 20, 50, 100, 200, 500].find((s) => max / s <= 5) ?? Math.ceil(max / 5);
  const top = Math.ceil(max / step) * step;
  return Array.from({ length: top / step + 1 }, (_, i) => i * step);
}

// 上端だけ角丸（4px）、ベースラインは直角の棒
function barPath(x: number, y: number, w: number, h: number): string {
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
}

export function MonthlyChart({ data, title }: { data: Point[]; title: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);
  const t = ticks(Math.max(...data.map((d) => d.count), 0));
  const top = t[t.length - 1];
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const slot = innerW / data.length;
  const bw = Math.min(24, slot * 0.6);
  const y = (v: number) => PAD.top + innerH - (v / top) * innerH;
  const last = data.length - 1;
  const maxIdx = data.reduce((best, d, i) => (d.count > data[best].count ? i : best), 0);
  const h = hover !== null ? data[hover] : null;

  return (
    <figure className="card space-y-2 p-4">
      <div className="flex items-baseline justify-between gap-2">
        <figcaption className="font-semibold">{title}</figcaption>
        <button type="button" onClick={() => setShowTable((v) => !v)} className="text-xs text-brand-600 hover:underline">
          {showTable ? "グラフで見る" : "表で見る"}
        </button>
      </div>
      {showTable ? (
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-slate-500">
            <tr>
              <th className="py-1">月</th>
              <th className="py-1 text-right">申込み件数</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((d) => (
              <tr key={d.month}>
                <td className="py-1">{d.month.replace("-", "年")}月</td>
                <td className="py-1 text-right tabular-nums">{d.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="relative">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${title}（${data.map((d) => `${d.label} ${d.count}件`).join("、")}）`}>
            {t.map((v) => (
              <g key={v}>
                <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} stroke={GRID} strokeWidth={1} />
                <text x={PAD.left - 6} y={y(v)} textAnchor="end" dominantBaseline="middle" className="fill-slate-500 text-[11px] tabular-nums">
                  {v}
                </text>
              </g>
            ))}
            {data.map((d, i) => {
              const cx = PAD.left + slot * i + slot / 2;
              const bh = (d.count / top) * innerH;
              const labelled = d.count > 0 && (i === last || i === maxIdx);
              return (
                <g key={d.month}>
                  {bh > 0 && <path d={barPath(cx - bw / 2, y(d.count), bw, bh)} fill={hover === i ? BAR_HOVER : BAR} />}
                  {labelled && (
                    <text x={cx} y={y(d.count) - 6} textAnchor="middle" className="fill-slate-700 text-[11px] font-semibold">
                      {d.count}
                    </text>
                  )}
                  <text x={cx} y={H - 8} textAnchor="middle" className={`text-[11px] ${i === last ? "fill-slate-800 font-semibold" : "fill-slate-500"}`}>
                    {d.label}
                  </text>
                  {/* 当たり判定は棒より広く（列全体） */}
                  <rect
                    x={PAD.left + slot * i}
                    y={PAD.top}
                    width={slot}
                    height={innerH}
                    fill="transparent"
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(null)}
                  />
                </g>
              );
            })}
          </svg>
          {h && hover !== null && (
            <div
              // 右端の棒ではツールチップを左側に出してはみ出しを防ぐ
              className={`pointer-events-none absolute whitespace-nowrap rounded-md border border-slate-200 bg-white px-2 py-1 text-xs shadow ${
                hover >= data.length - 2 ? "-translate-x-full" : hover <= 1 ? "" : "-translate-x-1/2"
              }`}
              style={{ left: `${((PAD.left + slot * hover + slot / 2) / W) * 100}%`, top: 0 }}
            >
              <div className="text-slate-500">{h.month.replace("-", "年")}月</div>
              <div className="font-semibold text-slate-900">申込み {h.count}件</div>
            </div>
          )}
        </div>
      )}
    </figure>
  );
}
