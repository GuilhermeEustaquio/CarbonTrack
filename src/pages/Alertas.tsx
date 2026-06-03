import { useState } from 'react';
import { Icon } from '../components/icons/Icon';
import { Badge } from '../components/ui';
import { useData } from '../context/DataContext';
import { useToasts } from '../hooks/useToasts';

const NIVEL_COR: Record<string, string> = { info: 'var(--ok)', atencao: 'var(--warn)', critico: 'var(--crit)' };
const NIVEL_ICON: Record<string, 'info' | 'alert' | 'flame'> = { info: 'info', atencao: 'alert', critico: 'flame' };

export function Alertas() {
  const { alertas, updateAlerta, empresas } = useData();
  const [push, toastNode] = useToasts();
  const [nivel, setNivel] = useState('todos');

  const empresasById = new Map(empresas.map(e => [e.id, e.nome]));
  const filtered = alertas.filter(a => nivel === 'todos' || a.nivel === nivel);

  return (
    <div className="view-enter">
      <div className="page-head">
        <div>
          <div className="eyebrow">Central · prevenção de riscos</div>
          <h1>Alertas <em>ambientais</em></h1>
          <div className="sub">Eventos de emissão, consumo elevado e impacto ambiental gerados automaticamente por regras do backend a partir das viagens e emissões de CO₂.</div>
        </div>
      </div>

      <div className="toolbar">
        {(['todos', 'info', 'atencao', 'critico'] as const).map(n => (
          <button className={`chip ${nivel === n ? 'active' : ''}`} onClick={() => setNivel(n)} key={n}>
            {n === 'todos' ? 'Todos' : n}
          </button>
        ))}
      </div>

      <div className="alerts">
        {filtered.map(a => {
          const empresaNome = a.empresa ?? empresasById.get(a.empresaId) ?? a.empresaId;
          return (
            <article
              className={`alert-item ${a.nivel === 'critico' ? 'crit' : a.nivel === 'atencao' ? 'warn' : 'ok'} ${a.resolvido ? 'opacity-60' : ''}`}
              key={a.id}
            >
              <div className="ai">
                <Icon name={NIVEL_ICON[a.nivel] ?? 'info'} />
              </div>
              <div style={{ flex: 1 }}>
                <b>{a.tipo}</b>
                <span>{empresaNome}</span>
                <small>{a.descricao} · {a.dataGeracao} · empresaId: {a.empresaId || '—'}{a.viagemId ? ` · viagemId: ${a.viagemId}` : ''}</small>
              </div>
              <Badge tone={(a.nivel === 'critico' ? 'crit' : a.nivel === 'atencao' ? 'warn' : 'ok') as never}>{a.nivel}</Badge>
              <button
                className="btn sm ghost"
                onClick={() => {
                  const result = updateAlerta(a.id, { lido: true, resolvido: !a.resolvido });
                  if (result.ok) push(a.resolvido ? 'Alerta reaberto.' : 'Alerta resolvido.', 'ok');
                  else push(result.error, 'warn');
                }}
              >
                {a.resolvido ? 'Reabrir' : 'Resolver'}
              </button>
            </article>
          );
        })}
      </div>

      {!filtered.length && (
        <div className="empty">
          <Icon name="inbox" />
          <h4>Nenhum alerta encontrado</h4>
          <div>Os alertas são gerados automaticamente pelo backend com base nos dados de emissão.</div>
        </div>
      )}

      {toastNode}
    </div>
  );
}
