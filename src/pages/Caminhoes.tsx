import { useMemo, useState } from 'react';
import { Icon } from '../components/icons/Icon';
import { Badge, ConfirmDelete, Field, Modal } from '../components/ui';
import { useData } from '../context/DataContext';
import { useToasts } from '../hooks/useToasts';
import type { Caminhao } from '../types/caminhao';

const blank: Partial<Caminhao> = {
  placa: '', modelo: '', anoFabricacao: new Date().getFullYear(),
  capacidadeCarga: 25, empresaId: '', ativo: true,
};

function CaminhaoForm({ inicial, error, onClose, onSave }: { inicial?: Caminhao; error?: string; onClose: () => void; onSave: (c: Partial<Caminhao>) => void }) {
  const { empresas } = useData();
  const [f, setF] = useState<Partial<Caminhao>>(inicial ?? { ...blank, empresaId: empresas[0]?.id ?? '' });
  const set = (k: keyof Caminhao, v: string | number) => setF(o => ({ ...o, [k]: v }));
  const valid = Boolean(f.placa && f.modelo && f.empresaId);
  return (
    <Modal title={inicial ? 'Editar caminhão' : 'Novo caminhão'} sub="Cadastre o veículo para vincular a viagens e calcular emissões automaticamente." onClose={onClose}>
      <div className="form-grid">
        <Field label="Placa"><input value={f.placa ?? ''} onChange={e => set('placa', e.target.value.toUpperCase())} placeholder="ABC-1234" maxLength={8} required /></Field>
        <Field label="Modelo">
          <input value={f.modelo ?? ''} onChange={e => set('modelo', e.target.value)} placeholder="Ex: Volvo FH 540" required />
        </Field>
        <Field label="Ano de fabricação"><input type="number" min={1990} max={new Date().getFullYear() + 1} value={f.anoFabricacao ?? new Date().getFullYear()} onChange={e => set('anoFabricacao', Number(e.target.value))} /></Field>
        <Field label="Cap. de carga (t)"><input type="number" min={0} value={f.capacidadeCarga ?? 0} onChange={e => set('capacidadeCarga', Number(e.target.value))} /></Field>
        <Field label="Empresa"><select value={f.empresaId ?? ''} onChange={e => set('empresaId', e.target.value)}><option value="">Selecione…</option>{empresas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}</select></Field>
        {error && <div className="field full"><div className="field-error">{error}</div></div>}
      </div>
      <div className="modal-actions">
        <button className="btn ghost" onClick={onClose}>Cancelar</button>
        <button className="btn primary" disabled={!valid} onClick={() => onSave(f)}><Icon name="check" />Salvar</button>
      </div>
    </Modal>
  );
}

export function Caminhoes() {
  const { caminhoes, empresas, createCaminhao, updateCaminhao, deleteCaminhao } = useData();
  const [push, toastNode] = useToasts();
  const [q, setQ] = useState('');
  const [empFiltro, setEmpFiltro] = useState('Todas');
  const [modal, setModal] = useState<Caminhao | undefined | null>(null);
  const [del, setDel] = useState<Caminhao | null>(null);
  const [formError, setFormError] = useState('');

  const ativos = useMemo(() => caminhoes.filter(c => c.ativo !== false), [caminhoes]);
  const filtered = useMemo(() => ativos.filter(c =>
    (empFiltro === 'Todas' || c.empresaId === empFiltro) &&
    [c.placa, c.modelo, c.empresa].join(' ').toLowerCase().includes(q.toLowerCase())
  ), [ativos, q, empFiltro]);

  const save = (input: Partial<Caminhao>) => {
    const result = modal ? updateCaminhao(modal.id, input as Caminhao) : createCaminhao(input as Caminhao);
    if (!result.ok) { setFormError(result.error); return; }
    setFormError(''); setModal(null); push(result.message ?? 'Caminhão salvo.', 'ok');
  };

  return (
    <div className="view-enter">
      <div className="page-head">
        <div>
          <div className="eyebrow">Frota · {ativos.length} veículos ativos</div>
          <h1>Caminhões <em>monitorados</em></h1>
          <div className="sub">Gerencie a frota de veículos e vincule a viagens para rastreamento de emissões de CO₂.</div>
        </div>
        <div className="head-actions">
          <button className="btn primary" onClick={() => { setFormError(''); setModal(undefined); }}><Icon name="plus" />Novo caminhão</button>
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        {([
          ['Veículos ativos', ativos.length, 'var(--blue)', 'truck'],
          ['Empresas com frota', new Set(ativos.map(c => c.empresaId)).size, 'var(--ok)', 'building'],
          ['Capacidade total (t)', ativos.reduce((s, c) => s + c.capacidadeCarga, 0), 'var(--teal)', 'trend'],
        ] as const).map(([l, v, c, ic]) => (
          <div className="kpi" key={l} style={{ '--accent': c } as React.CSSProperties}>
            <div className="k-top"><div className="k-icon"><Icon name={ic as never} /></div></div>
            <div className="k-value">{v}</div>
            <div className="k-foot"><span>{l}</span></div>
          </div>
        ))}
      </div>

      <div className="toolbar">
        <div className="search"><Icon name="search" /><input placeholder="Buscar por placa, modelo ou empresa…" value={q} onChange={e => setQ(e.target.value)} /></div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button className={`chip ${empFiltro === 'Todas' ? 'active' : ''}`} onClick={() => setEmpFiltro('Todas')}>Todas</button>
          {empresas.map(e => <button key={e.id} className={`chip ${empFiltro === e.id ? 'active' : ''}`} onClick={() => setEmpFiltro(e.id)}>{e.sigla}</button>)}
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="tbl">
            <thead><tr><th>Placa</th><th>Modelo / Ano</th><th>Cap. (t)</th><th>Empresa</th><th style={{ textAlign: 'right' }}>Ações</th></tr></thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td><span className="t-mono t-strong">{c.placa}</span></td>
                  <td><div className="t-strong">{c.modelo}</div><div className="t-muted" style={{ fontSize: 11 }}>{c.anoFabricacao}</div></td>
                  <td className="t-mono">{c.capacidadeCarga}</td>
                  <td className="t-muted">{c.empresa}</td>
                  <td>
                    <div className="row-actions">
                      <button className="icon-btn" aria-label="Editar" onClick={() => { setFormError(''); setModal(c); }}><Icon name="edit" /></button>
                      <button className="icon-btn" aria-label="Inativar" onClick={() => setDel(c)}><Icon name="trash" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filtered.length && <div className="empty"><Icon name="inbox" /><h4>Nenhum veículo encontrado</h4><div>Ajuste os filtros ou cadastre um novo caminhão.</div></div>}
      </div>

      {modal !== null && <CaminhaoForm inicial={modal} error={formError} onClose={() => setModal(null)} onSave={save} />}
      {del && <ConfirmDelete nome={`${del.placa} — ${del.modelo}`} tipo="caminhão" onCancel={() => setDel(null)} onConfirm={() => { const r = deleteCaminhao(del.id); if (r.ok) push(r.message ?? 'Caminhão inativado.', 'ok'); else push(r.error, 'warn'); setDel(null); }} />}
      {toastNode}
    </div>
  );
}
