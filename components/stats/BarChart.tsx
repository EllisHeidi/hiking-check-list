/**
 * Lightweight single-series SVG bar chart (no chart library).
 * Thin bars with rounded tops, a recessive baseline + one gridline, a hover
 * tooltip per column, and a visually-hidden table for screen readers.
 */
export interface BarDatum {
  key: string;
  label: string;
  value: number;
  /** Tooltip text; defaults to the formatted value. */
  detail?: string;
  highlight?: boolean;
}

const W = 400;
const H = 180;
const PAD = { top: 28, right: 8, bottom: 28, left: 8 };

function niceMax(v: number) {
  if (v <= 0) return 1;
  const mag = 10 ** Math.floor(Math.log10(v));
  const n = v / mag;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * mag;
}

export function BarChart({
  title,
  data,
  format,
  tone = "forest",
  caption,
}: {
  title: string;
  data: BarDatum[];
  format: (v: number) => string;
  tone?: "forest" | "ember" | "earth";
  caption?: string;
}) {
  const max = niceMax(Math.max(...data.map((d) => d.value), 0));
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const colW = innerW / Math.max(data.length, 1);
  const barW = Math.min(20, colW * 0.55);
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH;
  const fill = { forest: "fill-forest", ember: "fill-ember", earth: "fill-earth" }[tone];
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <figure className="rounded-sm border border-ink/10 bg-stone-50 p-4 sm:p-6">
      <figcaption className="flex items-baseline justify-between gap-4">
        <span className="eyebrow text-charcoal">{title}</span>
        {caption && <span className="font-mono text-xs text-slate">{caption}</span>}
      </figcaption>

      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 block h-auto w-full overflow-visible" aria-hidden>
        {/* Single recessive gridline at the scale max */}
        <line x1={PAD.left} x2={W - PAD.right} y1={y(max)} y2={y(max)} className="stroke-ink/10" strokeDasharray="2 4" />
        <text x={W - PAD.right} y={y(max) - 6} textAnchor="end" className="fill-mist font-mono text-[10px]">
          {format(max)}
        </text>
        <line x1={PAD.left} x2={W - PAD.right} y1={y(0)} y2={y(0)} className="stroke-ink/25" />

        {data.map((d, i) => {
          const cx = PAD.left + colW * i + colW / 2;
          const h = Math.max(0, y(0) - y(d.value));
          const r = Math.min(4, barW / 2, h);
          const x0 = cx - barW / 2;
          const top = y(d.value);
          const path =
            h > 0
              ? `M ${x0} ${y(0)} V ${top + r} Q ${x0} ${top} ${x0 + r} ${top} H ${x0 + barW - r} Q ${x0 + barW} ${top} ${x0 + barW} ${top + r} V ${y(0)} Z`
              : "";
          return (
            <g key={d.key} className="group">
              {/* Hit target: the whole column */}
              <rect x={cx - colW / 2} y={PAD.top - 20} width={colW} height={innerH + 20} className="fill-transparent" />
              {path && <path d={path} className={`${fill} ${d.highlight === false ? "opacity-35" : ""} transition-opacity group-hover:opacity-80`} />}
              <text
                x={cx}
                y={Math.max(top - 8, 12)}
                textAnchor="middle"
                className="pointer-events-none fill-ink font-mono text-[11px] opacity-0 transition-opacity group-hover:opacity-100"
              >
                {d.detail ?? format(d.value)}
              </text>
              <text x={cx} y={H - 8} textAnchor="middle" className="fill-slate font-mono text-[10px]">
                {d.label}
              </text>
              <title>{`${d.label}: ${d.detail ?? format(d.value)}`}</title>
            </g>
          );
        })}
      </svg>

      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Period</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.key}>
              <th scope="row">{d.label}</th>
              <td>{d.detail ?? format(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {total === 0 && <p className="mt-2 text-sm text-mist">Nothing logged in this period yet.</p>}
    </figure>
  );
}
