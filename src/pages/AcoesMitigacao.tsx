import { useMemo, useState } from 'react';
import { Icon } from '../components/icons/Icon';
import { Badge, ConfirmDelete, Field, Modal } from '../components/ui';
import { fmt } from '../lib/constants';
import { useData } from '../context/DataContext';
import { useToasts } from '../hooks/useToasts';
import type { AcaoMitigacao, StatusAcao } from '../types/emissao';

const statuses: Array<'todas' | StatusAcao> = ['todas', 'planejada', 'em andamento', 'concluída'];
const tone = (status: StatusAcao) => status === 'concluída' ? 'ok' : status === 'em andamento' ? 'info' : 'warn';

function ActionForm({ inicial, error, onClose, onSave }: { inicial?: AcaoMitigacao; error?: string; onClose: () => void; onSave: (a: AcaoMitigacao) => void }) {
  const { empresas, unidades } = useData();
  const firstEmpresa = empresas[0];
  const firstUnit = unidades.find(u => u.empresaId === firstEmpresa?.id) ?? unidades[0];
  const [f, setF] = useState<AcaoMitigacao>(inicial ?? { id: '', empresaId: firstEmpresa?.id ?? '', unidadeId: firstUnit?.id ?? '', tipo: '', descricao: '', impactoEstimado: 0, status: 'planejada', inicio: new Date().toISOString().slice(0, 10), prazo: new Date().toISOString().slice(0, 10) });
  const unidadesEmpresa = unidades.filter(u => u.empresaId === f.empresaId);
  const set = (k: keyof AcaoMitigacao, v: string | number) => setF(o => ({ ...o, [k]: v }));
  return <Modal title={inicial ? 'Editar ação' : 'Nova ação de mitigação'} onClose={onClose}>
    <div className="form-grid">
      <Field label="Tipo / título"><input value={f.tipo} onChange={e => set('tipo', e.target.value)} /></Field>
      <Field label="Empresa"><select value={f.empresaId} onChange={e => { const us = unidades.filter(u => u.empresaId === e.target.value); setF(o => ({ ...o, empresaId: e.target.value, unidadeId: us[0]?.id ?? '' })); }}>{empresas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}</select></Field>
      <Field label="Unidade"><select value={f.unidadeId} onChange={e => set('unidadeId', e.target.value)}>{unidadesEmpresa.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}</select></Field>
      <Field label="Status"><select value={f.status} onChange={e => set('status', e.target.value)}>{statuses.filter(s => s !== 'todas').map(s => <option key={s}>{s}</option>)}</select></Field>
      <Field label="Impacto estimado"><input type="number" value={f.impactoEstimado} onChange={e => set('impactoEstimado', Number(e.target.value))} /></Field>
      <Field label="Início"><input type="date" value={f.inicio} onChange={e => set('inicio', e.target.value)} /></Field>
      <Field label="Prazo"><input type="date" value={f.prazo} onChange={e => set('prazo', e.target.value)} /></Field>
      <Field label="Descrição" full><textarea value={f.descricao} onChange={e => set('descricao', e.target.value)} /></Field>
      {error && <div className="field full"><div className="field-error">{error}</div></div>}
    </div>
    <div className="modal-actions"><button className="btn ghost" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={() => onSave(f)}><Icon name="check" />Salvar</button></div>
  </Modal>;
}

export function AcoesMitigacao() {
  const { empresas, unidades, acoes, createAcao, updateAcao, deleteAcao } = useData();
  const [push, toastNode] = useToasts();
  const [status, setStatus] = useState<'todas' | StatusAcao>('todas');
  const [modal, setModal] = useState<AcaoMitigacao | undefined | null>(null);
  const [del, setDel] = useState<AcaoMitigacao | null>(null);
  const [formError, setFormError] = useState('');
  const filtered = useMemo(() => acoes.filter(a => status === 'todas' || a.status === status), [acoes, status]);
  const totalImpacto = filtered.reduce((s, a) => s + a.impactoEstimado, 0);
  const concluida = acoes.filter(a => a.status === 'concluída').length;
  const save = (acao: AcaoMitigacao) => { const result = modal ? updateAcao(modal.id, acao) : createAcao(acao); if (!result.ok) { setFormError(result.error); push(result.error, 'warn'); return; } setFormError(''); setModal(null); push(result.message ?? 'Ação salva.', 'ok'); };
  return <div className="view-enter"><div className="page-head"><div><div className="eyebrow">Mitigação · {acoes.length} ações persistidas</div><h1>Ações de <em>mitigação</em></h1><div className="sub">Planejamento e acompanhamento de iniciativas sustentáveis vinculadas a empresas, unidades e alertas ambientais.</div></div><button className="btn primary" onClick={() => { setFormError(''); setModal(undefined); }}><Icon name="plus" />Nova ação</button></div><div className="kpi-grid"><div className="kpi"><div className="k-value">{fmt(totalImpacto)}<small>t</small></div><div className="k-foot">Impacto estimado filtrado</div></div><div className="kpi"><div className="k-value">{concluida}</div><div className="k-foot">Concluídas</div></div><div className="kpi"><div className="k-value">{acoes.length - concluida}</div><div className="k-foot">Em execução ou planejadas</div></div></div><div className="toolbar"><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{statuses.map(s => <button key={s} className={`chip ${status === s ? 'active' : ''}`} onClick={() => setStatus(s)}>{s === 'todas' ? 'Todas' : s}</button>)}</div></div><div className="action-grid">{filtered.map(a => { const empresa = empresas.find(e => e.id === a.empresaId); const unidade = unidades.find(u => u.id === a.unidadeId); return <article className="card action-card" key={a.id}><div className="card-head"><div><h3><Icon name="leaf" /> {a.tipo}</h3><div className="ch-sub">{empresa?.nome ?? 'Empresa inativa'} · {unidade?.nome ?? 'Unidade não localizada'}</div></div><Badge tone={tone(a.status)}>{a.status}</Badge></div><div className="card-body"><p>{a.descricao || 'Descrição a complementar pela equipe.'}</p><div className="stat-pairs"><div className="sp"><div className="l">Impacto estimado</div><div className="v">{fmt(a.impactoEstimado)}<small>t CO₂</small></div></div><div className="sp"><div className="l">Prazo</div><div className="v t-mono" style={{ fontSize: 18 }}>{a.prazo}</div></div></div><div className="row-actions" style={{ marginTop: 14 }}><button className="btn sm" onClick={() => { setFormError(''); setModal(a); }}><Icon name="edit" />Editar</button><button className="btn sm ghost" onClick={() => setDel(a)}><Icon name="trash" />Excluir</button></div></div></article>; })}</div>{modal !== null && <ActionForm inicial={modal} error={formError} onClose={() => setModal(null)} onSave={save} />}{del && <ConfirmDelete nome={del.tipo} tipo="ação" onCancel={() => setDel(null)} onConfirm={() => { const result = deleteAcao(del.id); if (result.ok) push(result.message ?? 'Ação removida.', 'ok'); else push(result.error, 'warn'); setDel(null); }} />}{toastNode}</div>;
}
