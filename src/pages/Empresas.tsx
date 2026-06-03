import { useMemo, useState } from 'react';
import { Icon } from '../components/icons/Icon';
import { Badge, ConfirmDelete, Field, Logo, Modal, StatusBadge } from '../components/ui';
import { fmt, SETORES, UFS } from '../lib/constants';
import { getEmpresaVisualStats } from '../lib/selectors';
import { useData } from '../context/DataContext';
import { useToasts } from '../hooks/useToasts';
import { formatCnpj, unmaskCnpj } from '../utils/masks';
import { isCnpjLengthValid } from '../utils/validators';
import type { Empresa } from '../types/empresa';

const blank: Empresa = {
  id: '', nome: '', sigla: '', cor: '#3FB8C4', cnpj: '', setor: 'Logística',
  cidade: '', estado: 'SP', responsavel: '', dataCadastro: new Date().toISOString().slice(0, 10),
  metaMensal: 0, emissaoMes: 0, status: 'dentro', unidades: 0, tendencia: [0,0,0,0,0,0], ativo: true,
};

function EmpresaForm({ inicial, error, onClose, onSave }: { inicial?: Empresa; error?: string; onClose: () => void; onSave: (e: Empresa) => void }) {
  const [f, setF] = useState<Empresa>(inicial ?? blank);
  const set = (k: keyof Empresa, v: string | number) => setF(o => ({ ...o, [k]: v }));
  const valid = Boolean(f.nome && f.cnpj && isCnpjLengthValid(f.cnpj) && f.setor && f.cidade && f.estado && f.responsavel);
  return (
    <Modal title={inicial ? 'Editar empresa' : 'Nova empresa'} sub="Dados persistem localmente até a API Java real estar disponível." onClose={onClose}>
      <div className="form-grid">
        <Field label="Nome"><input value={f.nome} onChange={e => set('nome', e.target.value)} required /></Field>
        <Field label="CNPJ" error={f.cnpj && !isCnpjLengthValid(f.cnpj) ? 'CNPJ deve ter 14 dígitos' : error?.includes('CNPJ') ? error : undefined}>
          <input value={formatCnpj(f.cnpj)} onChange={e => set('cnpj', unmaskCnpj(e.target.value))} placeholder="00.000.000/0000-00" maxLength={18} required />
        </Field>
        <Field label="Responsável" full><input value={f.responsavel} onChange={e => set('responsavel', e.target.value)} required /></Field>
        <Field label="Setor"><select value={f.setor} onChange={e => set('setor', e.target.value)}>{SETORES.filter(s => s !== 'Todos').map(s => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Cidade"><input value={f.cidade} onChange={e => set('cidade', e.target.value)} /></Field>
        <Field label="Estado"><select value={f.estado} onChange={e => set('estado', e.target.value)}>{UFS.map(u => <option key={u}>{u}</option>)}</select></Field>
        <Field label="Meta mensal visual (t CO₂)" opt><input type="number" min="0" value={f.metaMensal} onChange={e => set('metaMensal', Number(e.target.value))} /></Field>
        {error && !error.includes('CNPJ') && <div className="field full"><div className="field-error">{error}</div></div>}
      </div>
      <div className="modal-actions">
        <button className="btn ghost" onClick={onClose}>Cancelar</button>
        <button className="btn primary" disabled={!valid} onClick={() => onSave(f)} type="button"><Icon name="check" />Salvar</button>
      </div>
    </Modal>
  );
}

export function Empresas() {
  const data = useData();
  const { empresas, createEmpresa, updateEmpresa, deleteEmpresa } = data;
  const [push, toastNode] = useToasts();
  const [q, setQ] = useState('');
  const [setor, setSetor] = useState('Todos');
  const [modal, setModal] = useState<Empresa | undefined | null>(null);
  const [del, setDel] = useState<Empresa | null>(null);
  const [sort, setSort] = useState<keyof Empresa>('nome');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() =>
    empresas
      .filter(e => (setor === 'Todos' || e.setor === setor) && [e.nome, e.cidade, e.cnpj].join(' ').toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => String(a[sort]).localeCompare(String(b[sort]))),
    [empresas, q, setor, sort]
  );

  const visualStats = useMemo(() => new Map(empresas.map(e => [e.id, getEmpresaVisualStats(data, e.id)])), [data, empresas]);

  const counts = {
    total: empresas.length,
    dentro: empresas.filter(e => visualStats.get(e.id)?.status === 'dentro').length,
    atencao: empresas.filter(e => visualStats.get(e.id)?.status === 'atencao').length,
    critico: empresas.filter(e => visualStats.get(e.id)?.status === 'critico').length,
  };

  const save = (empresa: Empresa) => {
    if (saving) return;
    setSaving(true);
    const result = modal ? updateEmpresa(modal.id, empresa) : createEmpresa(empresa);
    setSaving(false);
    if (!result.ok) { setFormError(result.error); return; }
    setFormError(''); setModal(null); push(result.message ?? 'Empresa salva com sucesso.', 'ok');
  };

  const confirmDelete = () => {
    if (!del) return;
    const result = deleteEmpresa(del.id);
    if (result.ok) push(result.message ?? 'Empresa inativada com sucesso.', 'ok'); else push(result.error, 'warn');
    setDel(null);
  };

  return (
    <div className="view-enter">
      <div className="page-head">
        <div>
          <div className="eyebrow">Cadastros · {counts.total} registros ativos</div>
          <h1>Empresas <em>monitoradas</em></h1>
          <div className="sub">Organizações acompanhadas pela plataforma, com metas de emissão, classificação automática e persistência via API Java.</div>
        </div>
        <div className="head-actions">
          <button className="btn primary" onClick={() => { setFormError(''); setModal(undefined); }}><Icon name="plus" />Nova empresa</button>
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        {([['Total', counts.total, 'var(--blue)', 'building'], ['Dentro da meta', counts.dentro, 'var(--ok)', 'checkCircle'], ['Em atenção', counts.atencao, 'var(--warn)', 'alert'], ['Em estado crítico', counts.critico, 'var(--crit)', 'flame']] as const).map(([l, v, c, ic]) => (
          <div className="kpi" key={l} style={{ '--accent': c } as React.CSSProperties}>
            <div className="k-top"><div className="k-icon"><Icon name={ic as never} /></div></div>
            <div className="k-value">{v}</div>
            <div className="k-foot"><span>{l}</span></div>
          </div>
        ))}
      </div>

      <div className="toolbar">
        <div className="search"><Icon name="search" /><input placeholder="Buscar por nome, cidade ou CNPJ…" value={q} onChange={e => setQ(e.target.value)} /></div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{SETORES.map(s => <button key={s} className={`chip ${setor === s ? 'active' : ''}`} onClick={() => setSetor(s)}>{s}</button>)}</div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                {(['nome', 'setor'] as const).map(k => <th key={k} onClick={() => setSort(k)}>{k}<Icon name="chevDown" size={13} /></th>)}
                <th>Local</th><th>Operação</th><th>Emissão / Meta</th><th>Status</th><th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => {
                const stats = visualStats.get(e.id) ?? getEmpresaVisualStats(data, e.id);
                return (
                  <tr key={e.id}>
                    <td><div className="cell-co"><Logo sigla={e.sigla} cor={e.cor} /><div><div className="t-strong">{e.nome}</div><div className="t-mono t-muted" style={{ fontSize: 11 }}>{e.cnpj}</div></div></div></td>
                    <td><Badge>{e.setor}</Badge></td>
                    <td className="t-muted"><div>{e.cidade} · {e.estado}</div><div style={{ fontSize: 11 }}>{e.responsavel}</div></td>
                    <td className="t-muted"><div>{stats.caminhoes} caminhões · {stats.motoristas} motoristas</div><div style={{ fontSize: 11 }}>{stats.viagens} viagens · {stats.alertas} alertas ativos</div></td>
                    <td><div className="t-mono">{fmt(stats.co2T, 2)} / {stats.metaMensalT ? fmt(stats.metaMensalT, 2) : 'sem meta'} t</div><div className="t-muted" style={{ fontSize: 11 }}>{stats.pctMeta == null ? 'Status por faixas de CO₂' : `${stats.pctMeta}% da meta`}</div></td>
                    <td><StatusBadge status={stats.status} /></td>
                    <td><div className="row-actions">
                      <button className="icon-btn" aria-label="Editar empresa" onClick={() => { setFormError(''); setModal(e); }}><Icon name="edit" /></button>
                      <button className="icon-btn" aria-label="Inativar empresa" onClick={() => setDel(e)}><Icon name="trash" /></button>
                    </div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!filtered.length && <div className="empty"><Icon name="inbox" /><h4>Nenhuma empresa encontrada</h4><div>Ajuste filtros ou cadastre uma nova organização.</div></div>}
      </div>

      {modal !== null && <EmpresaForm inicial={modal} error={formError} onClose={() => setModal(null)} onSave={save} />}
      {del && <ConfirmDelete nome={del.nome} tipo="empresa" onCancel={() => setDel(null)} onConfirm={confirmDelete} />}
      {toastNode}
    </div>
  );
}
