import { useId, useState } from 'react';
import { fmt } from '../../lib/constants';

type ChartDatum = { nome: string; valor: number; cor: string };
type Series = { name: string; data: number[]; color: string };

export function Sparkline({ data, w = 84, h = 28, color = 'var(--teal)', fill = true }: { data: number[]; w?: number; h?: number; color?: string; fill?: boolean }) {
  const min = Math.min(...data), max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - 3 - ((v - min) / span) * (h - 6);
    return [x, y] as const;
  });
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${w} ${h} L0 ${h} Z`;
  const gid = useId().replace(/:/g, '');
  return <svg className="spark" width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
    {fill && <defs><linearGradient id={`sg${gid}`} x1={0} y1={0} x2={0} y2={1}><stop offset="0%" stopColor={color} stopOpacity={0.28}/><stop offset="100%" stopColor={color} stopOpacity={0}/></linearGradient></defs>}
    {fill && <path d={area} fill={`url(#sg${gid})`}/>}<path d={line} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/><circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={2.4} fill={color}/>
  </svg>;
}

export function AreaChart({ series, labels, meta, height = 250 }: { series: Series[]; labels: string[]; meta?: number; height?: number }) {
  const W = 720, H = height, padL = 46, padR = 14, padT = 16, padB = 30;
  const iw = W - padL - padR, ih = H - padT - padB;
  const all = series.flatMap(s => s.data).concat(meta ? [meta] : []);
  const maxRaw = Math.max(...all);
  const max = Math.ceil(maxRaw / 1000) * 1000 * 1.04 || 1;
  const n = labels.length;
  const X = (i: number) => padL + (i / (n - 1)) * iw;
  const Y = (v: number) => padT + ih - (v / max) * ih;
  const [hover, setHover] = useState<number | null>(null);
  const ticks = 4;
  const gid = useId().replace(/:/g, '');
  const pathFor = (data: number[], area: boolean) => {
    let d = data.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(' ');
    if (area) d += ` L${X(n - 1)} ${padT + ih} L${X(0)} ${padT + ih} Z`;
    return d;
  };
  return <div className="chart-wrap" style={{ position: 'relative' }}><svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', overflow: 'visible' }} onMouseLeave={() => setHover(null)} onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); const px = ((e.clientX - r.left) / r.width) * W; let idx = Math.round(((px - padL) / iw) * (n - 1)); idx = Math.max(0, Math.min(n - 1, idx)); setHover(idx); }}>
    <defs>{series.map((s, si) => <linearGradient key={s.name} id={`ag${gid}${si}`} x1={0} y1={0} x2={0} y2={1}><stop offset="0%" stopColor={s.color} stopOpacity={si === 0 ? 0.26 : 0.10}/><stop offset="100%" stopColor={s.color} stopOpacity={0}/></linearGradient>)}</defs>
    {Array.from({ length: ticks + 1 }).map((_, i) => { const v = (max / ticks) * (ticks - i); const y = padT + (ih / ticks) * i; return <g key={i}><line className={`grid-line${i === ticks ? '' : ' dash'}`} x1={padL} y1={y} x2={W - padR} y2={y}/><text className="axis-label" x={padL - 8} y={y + 3} textAnchor="end">{fmt(v)}</text></g>; })}
    {meta && <g><line x1={padL} y1={Y(meta)} x2={W - padR} y2={Y(meta)} stroke="var(--crit)" strokeWidth={1.3} strokeDasharray="5 4" opacity={0.8}/><text x={W - padR} y={Y(meta) - 6} textAnchor="end" className="axis-label" style={{ fill: 'var(--crit)' }}>Meta {fmt(meta)}</text></g>}
    {series.map((s, si) => <g key={s.name}><path d={pathFor(s.data, true)} fill={`url(#ag${gid}${si})`}/><path d={pathFor(s.data, false)} fill="none" stroke={s.color} strokeWidth={si === 0 ? 2.4 : 1.8} strokeDasharray={si === 1 ? '5 4' : 'none'} strokeLinecap="round" strokeLinejoin="round"/></g>)}
    {labels.map((l, i) => <text key={l} className="axis-label" x={X(i)} y={H - 8} textAnchor="middle">{l}</text>)}
    {hover != null && <g><line x1={X(hover)} y1={padT} x2={X(hover)} y2={padT + ih} stroke="var(--line-2)" strokeWidth={1}/>{series.map(s => <circle key={s.name} cx={X(hover)} cy={Y(s.data[hover])} r={4} fill="var(--panel)" stroke={s.color} strokeWidth={2.2}/>)}</g>}
  </svg>{hover != null && <div style={{ position: 'absolute', left: `calc(${(X(hover) / W) * 100}% )`, top: 0, pointerEvents: 'none' }}><div style={{ position: 'absolute', transform: 'translateX(-50%)', whiteSpace: 'nowrap', background: 'var(--panel-3)', border: '1px solid var(--line-2)', borderRadius: 9, padding: '8px 11px', boxShadow: 'var(--shadow)', fontSize: 12 }}><div className="mono" style={{ fontSize: 10.5, color: 'var(--text-3)', marginBottom: 4, letterSpacing: '.05em' }}>{labels[hover]}</div>{series.map((s, si) => <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: si ? 3 : 0 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: s.color }}/><span style={{ color: 'var(--text-2)' }}>{s.name}</span><b className="mono" style={{ marginLeft: 'auto', paddingLeft: 12 }}>{fmt(s.data[hover])} t</b></div>)}</div></div>}</div>;
}

export function Donut({ data, size = 168, thickness = 22, center }: { data: ChartDatum[]; size?: number; thickness?: number; center?: { v: string; l: string } }) {
  const total = data.reduce((a, b) => a + b.valor, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let off = 0;
  const [hover, setHover] = useState<number | null>(null);
  return <div className="donut" style={{ position: 'relative', width: size, height: size, flex: `0 0 ${size}px` }}><svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--panel-3)" strokeWidth={thickness}/>{data.map((d, i) => { const len = (d.valor / total) * c; const dashOffset = -off; off += len; return <circle key={d.nome} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={d.cor} strokeWidth={hover === i ? thickness + 3 : thickness} strokeDasharray={`${len} ${c - len}`} strokeDashoffset={dashOffset} style={{ transition: 'stroke-width .15s', cursor: 'pointer' }} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}/>; })}</svg><div className="donut-center"><div className="dc-v">{hover != null ? `${data[hover].valor}%` : (center ? center.v : `${total}%`)}</div><div className="dc-l">{hover != null ? data[hover].nome : (center ? center.l : 'total')}</div></div></div>;
}

export function Gauge({ value, max = 100, size = 180, label, color = 'var(--teal)' }: { value: number; max?: number; size?: number; label?: string; color?: string }) {
  const r = size / 2 - 14;
  const cx = size / 2, cy = size / 2;
  const frac = Math.min(1, value / max);
  const arc = (a0: number, a1: number) => { const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0); const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1); const large = a1 - a0 > Math.PI ? 1 : 0; return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`; };
  return <div style={{ position: 'relative', width: size, height: size / 2 + 18 }}><svg width={size} height={size / 2 + 18} viewBox={`0 0 ${size} ${size / 2 + 18}`}><path d={arc(Math.PI, 2 * Math.PI)} fill="none" stroke="var(--panel-3)" strokeWidth={13} strokeLinecap="round"/><path d={arc(Math.PI, Math.PI + frac * Math.PI)} fill="none" stroke={color} strokeWidth={13} strokeLinecap="round"/></svg><div style={{ position: 'absolute', inset: 0, top: 14, display: 'grid', placeItems: 'center', textAlign: 'center' }}><div><div className="display" style={{ fontSize: 30 }}>{fmt(value, value % 1 ? 1 : 0)}%</div>{label && <div className="eyebrow" style={{ marginTop: 2 }}>{label}</div>}</div></div></div>;
}

export function BarList({ data }: { data: ChartDatum[] }) {
  const max = Math.max(...data.map(d => d.valor), 1);
  return <div>{data.map(d => <div className="bar-row" key={d.nome}><div className="bl"><span className="bt" style={{ background: d.cor }}/>{d.nome}</div><div className="bar-track"><div className="bar-fill" style={{ width: `${(d.valor / max) * 100}%`, background: d.cor }}/></div><div className="bv">{d.valor}%</div></div>)}</div>;
}
