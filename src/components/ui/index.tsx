import { useEffect, useState, type ReactNode } from 'react';
import { Icon, type IconName } from '../icons/Icon';
import type { StatusMeta, ToastType } from '../../types/common';

const STATUS_MAP = {
  dentro: { cls: 'ok', label: 'Dentro da meta' },
  atencao: { cls: 'warn', label: 'Atenção' },
  critico: { cls: 'crit', label: 'Crítico' },
} as const;
const RISCO_MAP = {
  baixo: { cls: 'ok', label: 'Baixo' },
  medio: { cls: 'warn', label: 'Médio' },
  alto: { cls: 'crit', label: 'Alto' },
} as const;

export function Button({ children, className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) { return <button className={`btn ${className}`} {...props}>{children}</button>; }
export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'ok' | 'warn' | 'crit' | 'neutral' | 'info' }) { return <span className={`badge ${tone}`}><span className="dot" />{children}</span>; }
export function StatusBadge({ status }: { status: StatusMeta }) { const m = STATUS_MAP[status] || STATUS_MAP.dentro; return <span className={`badge ${m.cls}`}><span className="dot" />{m.label}</span>; }
export function RiskBadge({ risco }: { risco: 'baixo' | 'medio' | 'alto' }) { const m = RISCO_MAP[risco] || RISCO_MAP.baixo; return <span className={`badge ${m.cls}`}><span className="dot" />{m.label}</span>; }
export function Logo({ sigla, cor, size = 34 }: { sigla: string; cor: string; size?: number }) { return <div className="logo" style={{ width: size, height: size, flex: `0 0 ${size}px`, fontSize: size * 0.38, background: `color-mix(in oklch, ${cor} 22%, transparent)`, color: cor, borderColor: `color-mix(in oklch, ${cor} 30%, transparent)` }}>{sigla}</div>; }
export function Delta({ value, invert = true }: { value: number; invert?: boolean }) { if (value === 0) return <span className="delta" style={{ color: 'var(--text-3)' }}>—</span>; const up = value > 0; const good = invert ? !up : up; return <span className={`delta ${up ? 'up' : 'down'}`} style={good ? { color: 'var(--ok)' } : undefined}><Icon name={up ? 'arrowUp' : 'arrowDown'} />{Math.abs(value).toFixed(1)}%</span>; }

export function Modal({ title, sub, onClose, children, footer, wide }: { title: string; sub?: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [onClose]);
  return <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }} role="presentation"><div className={`modal${wide ? ' wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}><div className="modal-head"><div><h2>{title}</h2>{sub && <div className="mh-sub">{sub}</div>}</div><button className="icon-btn" onClick={onClose} aria-label="Fechar"><Icon name="x" /></button></div><div className="modal-body">{children}</div>{footer && <div className="modal-foot">{footer}</div>}</div></div>;
}

export function Field({ label, opt, hint, full, children, error }: { label?: string; opt?: boolean; hint?: string; full?: boolean; children: ReactNode; error?: string }) { return <div className={`field${full ? ' full' : ''}`}>{label && <label>{label}{opt && <span className="opt">opcional</span>}</label>}{children}{hint && <div className="hint">{hint}</div>}{error && <div className="field-error">{error}</div>}</div>; }
export function Card({ title, icon, sub, action, children, style, className }: { title?: string; icon?: IconName; sub?: string; action?: ReactNode; children: ReactNode; style?: React.CSSProperties; className?: string }) { return <section className={`card ${className || ''}`} style={style}>{(title || action) && <div className="card-head"><div><h3>{icon && <Icon name={icon} style={{ color: 'var(--text-3)' }} />} {title}</h3>{sub && <div className="ch-sub">{sub}</div>}</div>{action}</div>}<div className="card-body">{children}</div></section>; }
export function ConfirmDelete({ nome, tipo, onCancel, onConfirm, vinculos = [] }: { nome: string; tipo: string; onCancel: () => void; onConfirm: () => void; vinculos?: string[] }) {
  const temVinculos = vinculos.length > 0;
  return <Modal title={`Excluir ${tipo}?`} onClose={onCancel} footer={<><button className="btn ghost" onClick={onCancel}>Cancelar</button><button className="btn danger" onClick={onConfirm}><Icon name="trash" />Confirmar</button></>}>
    <p style={{ margin: 0, color: 'var(--text-2)', lineHeight: 1.6 }}>Você está prestes a remover <b style={{ color: 'var(--text)' }}>{nome}</b>.</p>
    {temVinculos && (
      <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 10, background: 'color-mix(in oklch, var(--warn) 12%, transparent)', border: '1px solid color-mix(in oklch, var(--warn) 32%, transparent)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--warn)', fontWeight: 600, marginBottom: 6 }}><Icon name="alert" size={16} />Este {tipo} tem registros vinculados</div>
        <div style={{ color: 'var(--text-2)', fontSize: 13, lineHeight: 1.6 }}>Vinculados: <b style={{ color: 'var(--text)' }}>{vinculos.join(', ')}</b>. Eles também serão removidos. O servidor pode recusar a exclusão se alguma viagem já tiver emissões registradas.</div>
      </div>
    )}
  </Modal>;
}
export function LoadingScreen({ label = 'Sincronizando dados da API' }: { label?: string }) {
  return (
    <div className="loading-screen">
      <div className="ls-inner">
        <div className="ls-sonar">
          <span className="ls-wave" />
          <span className="ls-wave" />
          <span className="ls-wave" />
          <span className="ls-core"><Icon name="leaf" size={26} /></span>
        </div>
        <div className="ls-text">
          <div className="ls-brand">Carbon<span>Track</span></div>
          <div className="ls-label">{label}</div>
        </div>
        <div className="ls-bar"><span className="ls-bar-fill" /></div>
      </div>
    </div>
  );
}

export function useToasts(): [(msg: string, type?: ToastType) => void, ReactNode] { const [toasts, setToasts] = useState<{ id: string; msg: string; type: ToastType }[]>([]); const push = (msg: string, type: ToastType = 'ok') => { const id = Math.random().toString(36).slice(2); setToasts(t => [...t, { id, msg, type }]); setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2600); }; const node = <div className="toast-wrap">{toasts.map(t => <div className={`toast ${t.type}`} key={t.id}><Icon name={t.type === 'crit' ? 'alert' : t.type === 'warn' ? 'alert' : 'checkCircle'} />{t.msg}</div>)}</div>; return [push, node]; }
