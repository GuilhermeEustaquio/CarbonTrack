import { useMemo, useState } from 'react';
import { Icon } from '../components/icons/Icon';
import { Badge, ConfirmDelete, Field, Modal } from '../components/ui';
import { useData } from '../context/DataContext';
import { useToasts } from '../hooks/useToasts';
import { formatCpf, unmaskCpf, formatCnh } from '../utils/masks';
import type { Motorista } from '../types/motorista';

const blank: Partial<Motorista> = {
  nome: '', cpf: '', numeroCnh: '', validadeCnh: '', empresaId: '', ativo: true,
};

function MotoristaForm({ inicial, error, onClose, onSave }: { inicial?: Motorista; error?: string; onClose: () => void; onSave: (m: Partial<Motorista>) => void }) {
  const { empresas } = useData();
  const [f, setF] = useState<Partial<Motorista>>(inicial ?? { ...blank, empresaId: empresas[0]?.id ?? '' });
  const set = (k: keyof Motorista, v: string) => setF(o => ({ ...o, [k]: v }));
  const valid = Boolean(f.nome?.trim() && f.cpf?.replace(/\D/g,'').length === 11 && f.empresaId && f.numeroCnh);
  return (
    <Modal title={inicial ? 'Editar motorista' : 'Novo motorista'} sub="Vincule o motorista a uma empresa para rastrear emissões por condutor." onClose={onClose}>
      <div className="form-grid">
        <Field label="Nome completo" full><input value={f.nome ?? ''} onChange={e => set('nome', e.target.value)} required /></Field>
        <Field label="CPF" error={f.cpf && unmaskCpf(f.cpf).length > 0 && unmaskCpf(f.cpf).length !== 11 ? 'CPF deve ter 11 dígitos' : undefined}>
          <input value={formatCpf(f.cpf ?? '')} onChange={e => set('cpf', unmaskCpf(e.target.value))} placeholder="000.000.000-00" maxLength={14} inputMode="numeric" required />
        </Field>
        <Field label="Número da CNH"><input value={formatCnh(f.numeroCnh ?? '')} onChange={e => set('numeroCnh', formatCnh(e.target.value))} placeholder="Ex: 12345678901" maxLength={11} inputMode="numeric" /></Field>
        <Field label="Validade da CNH"><input type="date" value={f.validadeCnh ?? ''} onChange={e => set('validadeCnh', e.target.value)} /></Field>
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

export function Motoristas() {
  const { motoristas, empresas, createMotorista, updateMotorista, deleteMotorista, contarVinculos } = useData();
  const [push, toastNode] = useToasts();
  const [q, setQ] = useState('');
  const [empFiltro, setEmpFiltro] = useState('Todas');
  const [modal, setModal] = useState<Motorista | undefined | null>(null);
  const [del, setDel] = useState<Motorista | null>(null);
  const [formError, setFormError] = useState('');

  const ativos = useMemo(() => motoristas.filter(m => m.ativo !== false), [motoristas]);
  const filtered = useMemo(() => ativos.filter(m =>
    (empFiltro === 'Todas' || m.empresaId === empFiltro) &&
    [m.nome, m.cpf, m.empresa].join(' ').toLowerCase().includes(q.toLowerCase())
  ), [ativos, q, empFiltro]);

  const save = (input: Partial<Motorista>) => {
    const result = modal ? updateMotorista(modal.id, input as Motorista) : createMotorista(input as Motorista);
    if (!result.ok) { setFormError(result.error); return; }
    setFormError(''); setModal(null);
  };

  return (
    <div className="view-enter">
      <div className="page-head">
        <div>
          <div className="eyebrow">Condutores · {ativos.length} ativos</div>
          <h1>Motoristas <em>cadastrados</em></h1>
          <div className="sub">Vincule motoristas a empresas para rastreamento de emissões por condutor nas viagens registradas.</div>
        </div>
        <div className="head-actions">
          <button className="btn primary" onClick={() => { setFormError(''); setModal(undefined); }}><Icon name="plus" />Novo motorista</button>
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        {([
          ['Motoristas ativos', ativos.length, 'var(--blue)', 'user'],
          ['Empresas cobertas', new Set(ativos.map(m => m.empresaId)).size, 'var(--teal)', 'building'],
          ['CNH em vencimento', ativos.filter(m => { const d = new Date(m.validadeCnh); return d > new Date() && d < new Date(Date.now() + 90*24*3600*1000); }).length, 'var(--warn)', 'alert'],
        ] as const).map(([l, v, c, ic]) => (
          <div className="kpi" key={l} style={{ '--accent': c } as React.CSSProperties}>
            <div className="k-top"><div className="k-icon"><Icon name={ic as never} /></div></div>
            <div className="k-value">{v}</div>
            <div className="k-foot"><span>{l}</span></div>
          </div>
        ))}
      </div>

      <div className="toolbar">
        <div className="search"><Icon name="search" /><input placeholder="Buscar por nome, CPF ou empresa…" value={q} onChange={e => setQ(e.target.value)} /></div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button className={`chip ${empFiltro === 'Todas' ? 'active' : ''}`} onClick={() => setEmpFiltro('Todas')}>Todas</button>
          {empresas.map(e => <button key={e.id} className={`chip ${empFiltro === e.id ? 'active' : ''}`} onClick={() => setEmpFiltro(e.id)}>{e.sigla}</button>)}
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="tbl">
            <thead><tr><th>Nome</th><th>CPF</th><th>Número da CNH</th><th>Validade da CNH</th><th>Empresa</th><th style={{ textAlign: 'right' }}>Ações</th></tr></thead>
            <tbody>
              {filtered.map(m => {
                const cnh = m.validadeCnh ? new Date(m.validadeCnh) : null;
                const vencida = cnh && cnh < new Date();
                return (
                  <tr key={m.id}>
                    <td className="t-strong">{m.nome}</td>
                    <td className="t-mono t-muted">{formatCpf(m.cpf)}</td>
                    <td><Badge>{m.numeroCnh}</Badge></td>
                    <td><span style={{ color: vencida ? 'var(--crit)' : 'inherit', fontSize: 12 }}>{m.validadeCnh || '—'}{vencida && ' ⚠️'}</span></td>
                    <td className="t-muted">{m.empresa}</td>
                    <td>
                      <div className="row-actions">
                        <button className="icon-btn" aria-label="Editar" onClick={() => { setFormError(''); setModal(m); }}><Icon name="edit" /></button>
                        <button className="icon-btn" aria-label="Inativar" onClick={() => setDel(m)}><Icon name="trash" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!filtered.length && <div className="empty"><Icon name="inbox" /><h4>Nenhum motorista encontrado</h4><div>Ajuste os filtros ou cadastre um novo condutor.</div></div>}
      </div>

      {modal !== null && <MotoristaForm inicial={modal} error={formError} onClose={() => setModal(null)} onSave={save} />}
      {del && <ConfirmDelete nome={del.nome} tipo="motorista" vinculos={contarVinculos('motorista', del.id)} onCancel={() => setDel(null)} onConfirm={async () => { setDel(null); const r = await deleteMotorista(del.id); if (!r.ok) push(r.error, 'crit'); }} />}
      {toastNode}
    </div>
  );
}
