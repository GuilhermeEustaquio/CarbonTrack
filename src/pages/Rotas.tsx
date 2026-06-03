import { useMemo, useState } from 'react';
import { Icon } from '../components/icons/Icon';
import { Badge, ConfirmDelete, Field, Modal } from '../components/ui';
import { fmt, REGIOES } from '../lib/constants';
import { RotaMap, RoutePickerMap } from '../components/maps/RotaMap';
import { useData } from '../context/DataContext';
import { useToasts } from '../hooks/useToasts';
import type { Rota } from '../types/rota';

const blank: Partial<Rota> = {
  nome: '', origem: '', destino: '', distanciaKm: 0, regiao: '', ativo: true,
};

function RotaForm({ inicial, error, onClose, onSave }: {
  inicial?: Rota;
  error?: string;
  onClose: () => void;
  onSave: (r: Partial<Rota>) => void;
}) {
  const [f, setF] = useState<Partial<Rota>>(inicial ?? { ...blank });

  const set = (k: keyof Rota, v: string | number) => setF(o => ({ ...o, [k]: v }));

  const handleMapChange = (coords: { origemLat?: number; origemLon?: number; destinoLat?: number; destinoLon?: number }) => {
    setF(o => {
      const next = { ...o, ...coords };
      if (!Number.isFinite(coords.origemLat) && !Number.isFinite(coords.destinoLat)) {
        delete next.origemLat; delete next.origemLon;
        delete next.destinoLat; delete next.destinoLon;
      }
      return next;
    });
  };

  const mapValue = {
    origemLat: f.origemLat,
    origemLon: f.origemLon,
    destinoLat: f.destinoLat,
    destinoLon: f.destinoLon,
  };

  const valid = Boolean(f.nome?.trim() && f.origem?.trim() && f.destino?.trim() && Number(f.distanciaKm) > 0);

  return (
    <Modal
      title={inicial ? 'Editar rota' : 'Nova rota'}
      sub="Preencha os textos da rota e use o mapa apenas para gravar coordenadas de origem e destino."
      onClose={onClose}
    >
      <div className="field full">
        <RoutePickerMap value={mapValue} onChange={handleMapChange} />
      </div>
      <div className="form-grid" style={{ marginTop: 16 }}>
        <Field label="Nome da rota"><input value={f.nome ?? ''} onChange={e => set('nome', e.target.value)} placeholder="Ex: Linha SP-Campinas" required /></Field>
        <Field label="Origem">
          <input
            value={f.origem ?? ''}
            onChange={e => set('origem', e.target.value)}
            placeholder="Ex: São Paulo - SP"
            required
          />
        </Field>
        <Field label="Destino">
          <input
            value={f.destino ?? ''}
            onChange={e => set('destino', e.target.value)}
            placeholder="Ex: Campinas - SP"
            required
          />
        </Field>
        <Field label="Distância (km)">
          <input
            type="number"
            min={1}
            value={f.distanciaKm ?? 0}
            onChange={e => set('distanciaKm', Number(e.target.value))}
            required
          />
        </Field>
        <Field label="Região">
          <select value={f.regiao ?? ''} onChange={e => set('regiao', e.target.value)}>
            <option value="">Selecione…</option>
            {REGIOES.map(r => <option key={r}>{r}</option>)}
          </select>
        </Field>
        <div className="field full"><div className="t-muted" style={{ fontSize: 12 }}><strong>Coordenadas selecionadas</strong><br />Origem: {Number.isFinite(f.origemLat) ? `${f.origemLat?.toFixed(6)}, ${f.origemLon?.toFixed(6)}` : 'não definida'}<br />Destino: {Number.isFinite(f.destinoLat) ? `${f.destinoLat?.toFixed(6)}, ${f.destinoLon?.toFixed(6)}` : 'não definido'}</div></div>
        {error && <div className="field full"><div className="field-error">{error}</div></div>}
      </div>
      <div className="modal-actions">
        <button className="btn ghost" onClick={onClose}>Cancelar</button>
        <button className="btn primary" disabled={!valid} onClick={() => onSave(f)}><Icon name="check" />Salvar</button>
      </div>
    </Modal>
  );
}

export function Rotas() {
  const { rotas, createRota, updateRota, deleteRota } = useData();
  const [push, toastNode] = useToasts();
  const [q, setQ] = useState('');
  const [regiaoFiltro, setRegiaoFiltro] = useState('Todas');
  const [modal, setModal] = useState<Rota | undefined | null>(null);
  const [del, setDel] = useState<Rota | null>(null);
  const [formError, setFormError] = useState('');

  const ativas = useMemo(() => rotas.filter(r => r.ativo !== false), [rotas]);
  const filtered = useMemo(() => ativas.filter(r =>
    (regiaoFiltro === 'Todas' || r.regiao === regiaoFiltro) &&
    [r.nome, r.origem, r.destino, r.regiao].join(' ').toLowerCase().includes(q.toLowerCase())
  ), [ativas, q, regiaoFiltro]);

  const save = (input: Partial<Rota>) => {
    const result = modal ? updateRota(modal.id, input as Rota) : createRota(input as Rota);
    if (!result.ok) { setFormError(result.error); return; }
    setFormError(''); setModal(null); push(result.message ?? 'Rota salva.', 'ok');
  };

  return (
    <div className="view-enter">
      <div className="page-head">
        <div>
          <div className="eyebrow">Rotas · {ativas.length} cadastradas</div>
          <h1>Rotas <em>logísticas</em></h1>
          <div className="sub">Cadastre as rotas percorridas pela frota. As emissões de CO₂ são calculadas automaticamente pelo backend ao registrar viagens.</div>
        </div>
        <div className="head-actions">
          <button className="btn primary" onClick={() => { setFormError(''); setModal(undefined); }}><Icon name="plus" />Nova rota</button>
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        {([
          ['Rotas cadastradas', ativas.length, 'var(--blue)', 'pin'],
          ['Distância total (km)', fmt(filtered.reduce((s, r) => s + r.distanciaKm, 0)), 'var(--teal)', 'trend'],
          ['Distância média (km)', fmt(filtered.length ? filtered.reduce((s, r) => s + r.distanciaKm, 0) / filtered.length : 0, 0), 'var(--ok)', 'cloud'],
        ] as const).map(([l, v, c, ic]) => (
          <div className="kpi" key={l} style={{ '--accent': c } as React.CSSProperties}>
            <div className="k-top"><div className="k-icon"><Icon name={ic as never} /></div></div>
            <div className="k-value">{v}</div>
            <div className="k-foot"><span>{l}</span></div>
          </div>
        ))}
      </div>

      <RotaMap rotas={filtered} />

      <div className="toolbar" style={{ marginTop: 16 }}>
        <div className="search"><Icon name="search" /><input placeholder="Buscar por origem, destino ou região…" value={q} onChange={e => setQ(e.target.value)} /></div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button className={`chip ${regiaoFiltro === 'Todas' ? 'active' : ''}`} onClick={() => setRegiaoFiltro('Todas')}>Todas</button>
          {REGIOES.map(r => <button key={r} className={`chip ${regiaoFiltro === r ? 'active' : ''}`} onClick={() => setRegiaoFiltro(r)}>{r}</button>)}
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Rota</th>
                <th>Distância (km)</th>
                <th>Região</th>
                <th>Coord.</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td>
                    <div className="t-strong">{r.nome || `${r.origem} → ${r.destino}`}</div>
                    <div className="t-muted" style={{ fontSize: 11 }}>{r.origem} → {r.destino}</div>
                  </td>
                  <td className="t-mono">{fmt(r.distanciaKm)}</td>
                  <td>{r.regiao ? <Badge>{r.regiao}</Badge> : <span className="t-muted">—</span>}</td>
                  <td>
                    {Number.isFinite(r.origemLat)
                      ? <span style={{ fontSize: 11, color: 'var(--ok)' }}>● georreferenciada</span>
                      : <span className="t-muted" style={{ fontSize: 11 }}>sem coords</span>}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="icon-btn" aria-label="Editar" onClick={() => { setFormError(''); setModal(r); }}><Icon name="edit" /></button>
                      <button className="icon-btn" aria-label="Inativar" onClick={() => setDel(r)}><Icon name="trash" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filtered.length && (
          <div className="empty">
            <Icon name="inbox" />
            <h4>Nenhuma rota encontrada</h4>
            <div>Cadastre rotas para vincular às viagens e calcular emissões de CO₂.</div>
          </div>
        )}
      </div>

      {modal !== null && <RotaForm inicial={modal} error={formError} onClose={() => setModal(null)} onSave={save} />}
      {del && (
        <ConfirmDelete
          nome={del.nome || `${del.origem} → ${del.destino}`}
          tipo="rota"
          onCancel={() => setDel(null)}
          onConfirm={() => { const r2 = deleteRota(del.id); if (r2.ok) push(r2.message ?? 'Rota inativada.', 'ok'); else push(r2.error, 'warn'); setDel(null); }}
        />
      )}
      {toastNode}
    </div>
  );
}