import { useMemo, useState } from 'react';
import { Icon } from '../components/icons/Icon';
import { Badge, ConfirmDelete, Field, Modal } from '../components/ui';
import { CONSUMO_MEDIO_ESTIMADO_KM_POR_LITRO, fmt } from '../lib/constants';
import { getCo2Total, getEmissoesPorViagem } from '../lib/selectors';
import { useData } from '../context/DataContext';
import { useToasts } from '../hooks/useToasts';
import type { Viagem } from '../types/viagem';

const IMPACTO_COR: Record<string, string> = { baixo: 'var(--ok)', medio: 'var(--warn)', alto: 'var(--crit)' };

function ViagemForm({ inicial, error, onClose, onSave }: { inicial?: Viagem; error?: string; onClose: () => void; onSave: (v: Partial<Viagem>) => void }) {
  const { empresas, caminhoes, motoristas, rotas, combustiveis } = useData();
  const camAtivos = caminhoes.filter(c => c.ativo !== false);
  const motAtivos = motoristas.filter(m => m.ativo !== false);
  const rotAtivas = rotas.filter(r => r.ativo !== false);
  const firstCam = camAtivos[0];
  const firstMot = motAtivos[0];
  const firstRot = rotAtivas[0];
  const firstComb = combustiveis[0];

  const [f, setF] = useState<Partial<Viagem>>(inicial ?? {
    caminhaoId: firstCam?.id ?? '',
    motoristaId: firstMot?.id ?? '',
    rotaId: firstRot?.id ?? '',
    combustivelId: firstComb?.id ?? '',
    distanciaPercorridaKm: firstRot?.distanciaKm ?? 0,
    cargaTransportadaKg: 15000,
    dataViagem: new Date().toISOString().slice(0, 10),
    empresaId: firstCam?.empresaId ?? empresas[0]?.id ?? '',
  });

  const update = (patch: Partial<Viagem>) => setF(o => ({ ...o, ...patch }));

  const onRotaChange = (rotaId: string) => {
    const rota = rotAtivas.find(r => r.id === rotaId);
    update({ rotaId, distanciaPercorridaKm: rota?.distanciaKm ?? f.distanciaPercorridaKm });
  };

  const onCaminhaoChange = (camId: string) => {
    const cam = camAtivos.find(c => c.id === camId);
    update({ caminhaoId: camId, empresaId: cam?.empresaId ?? f.empresaId });
  };

  const valid = Boolean(f.caminhaoId && f.motoristaId && f.rotaId && f.combustivelId && Number(f.distanciaPercorridaKm) > 0 && f.dataViagem);

  return (
    <Modal title={inicial ? 'Editar viagem' : 'Registrar viagem'} sub="O CO₂ emitido e consumo são calculados automaticamente pelo backend após o registro." onClose={onClose}>
      <div className="form-grid">
        <Field label="Caminhão"><select value={f.caminhaoId ?? ''} onChange={e => onCaminhaoChange(e.target.value)}><option value="">Selecione…</option>{camAtivos.map(c => <option key={c.id} value={c.id}>{c.placa} — {c.modelo}</option>)}</select></Field>
        <Field label="Motorista"><select value={f.motoristaId ?? ''} onChange={e => update({ motoristaId: e.target.value })}><option value="">Selecione…</option>{motAtivos.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}</select></Field>
        <Field label="Rota"><select value={f.rotaId ?? ''} onChange={e => onRotaChange(e.target.value)}><option value="">Selecione…</option>{rotAtivas.map(r => <option key={r.id} value={r.id}>{r.nome || `${r.origem} → ${r.destino}`} — {r.distanciaKm} km</option>)}</select></Field>
        <Field label="Combustível"><select value={f.combustivelId ?? ''} onChange={e => update({ combustivelId: e.target.value })}><option value="">Selecione…</option>{combustiveis.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></Field>
        <Field label="Distância percorrida (km)"><input type="number" min={1} value={f.distanciaPercorridaKm ?? 0} onChange={e => update({ distanciaPercorridaKm: Number(e.target.value) })} /></Field>
        <Field label="Carga transportada (kg)"><input type="number" min={0} value={f.cargaTransportadaKg ?? 0} onChange={e => update({ cargaTransportadaKg: Number(e.target.value) })} /></Field>
        <Field label="Data da viagem"><input type="date" value={f.dataViagem ?? ''} onChange={e => update({ dataViagem: e.target.value })} /></Field>
        {error && <div className="field full"><div className="field-error">{error}</div></div>}
      </div>
      <div className="modal-actions">
        <button className="btn ghost" onClick={onClose}>Cancelar</button>
        <button className="btn primary" disabled={!valid} onClick={() => onSave(f)}><Icon name="check" />Salvar</button>
      </div>
    </Modal>
  );
}

export function Viagens() {
  const data = useData();
  const { viagens, empresas, combustiveis, rotas, mode, createViagem, updateViagem, deleteViagem } = data;
  const [push, toastNode] = useToasts();
  const [q, setQ] = useState('');
  const [modal, setModal] = useState<Viagem | undefined | null>(null);
  const [del, setDel] = useState<Viagem | null>(null);
  const [formError, setFormError] = useState('');

  const emissoesByViagem = useMemo(() => getEmissoesPorViagem(data), [data]);

  const combustiveisById = useMemo(() => {
    const map = new Map<string, string>();
    combustiveis.forEach(c => map.set(c.id, c.nome));
    return map;
  }, [combustiveis]);

  const rotasById = useMemo(() => {
    const map = new Map<string, typeof rotas[number]>();
    rotas.forEach(r => map.set(r.id, r));
    return map;
  }, [rotas]);

  const filtered = useMemo(() => viagens.filter(v =>
    [v.placa, v.motorista, v.rota, v.empresa, v.dataViagem].join(' ').toLowerCase().includes(q.toLowerCase())
  ), [viagens, q]);

  const co2Total = useMemo(() => getCo2Total(data), [data]);

  const save = (input: Partial<Viagem>) => {
    const result = modal ? updateViagem(modal.id, input as Viagem) : createViagem(input as Viagem);
    if (!result.ok) { setFormError(result.error); return; }
    setFormError(''); setModal(null); push(result.message ?? 'Viagem salva.', 'ok');
  };

  return (
    <div className="view-enter">
      <div className="page-head">
        <div>
          <div className="eyebrow">Logística · {viagens.length} viagens</div>
          <h1>Viagens e <em>emissões</em></h1>
          <div className="sub">Registre viagens para gerar emissões e alertas ambientais a partir de caminhão, motorista, rota e combustível.</div>
        </div>
        <div className="head-actions">
          <button className="btn primary" onClick={() => { setFormError(''); setModal(undefined); }}><Icon name="plus" />Registrar viagem</button>
        </div>
      </div>


      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div className="eyebrow">Cálculo automático · consumo estimado</div>
        <div className="sub" style={{ marginTop: 6 }}>
          Consumo e CO₂ são estimados automaticamente no modo local. Fórmula: distância ÷ {CONSUMO_MEDIO_ESTIMADO_KM_POR_LITRO} km/L × fator do combustível.
          {mode === 'api' ? ' No modo API, o backend Java é responsável pelo cálculo.' : ' Média mock: 3 km/L; no backend real, esse cálculo será feito pela API Java.'}
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        {([
          ['Total de viagens', viagens.length, 'var(--blue)', 'truck'],
          ['Emissões únicas', emissoesByViagem.size, 'var(--teal)', 'trend'],
          ['CO₂ total (kg)', fmt(co2Total, 1), 'var(--crit)', 'cloud'],
          ['Empresas ativas', new Set(viagens.map(v => v.empresaId).filter(Boolean)).size, 'var(--ok)', 'building'],
        ] as const).map(([l, v, c, ic]) => (
          <div className="kpi" key={l} style={{ '--accent': c } as React.CSSProperties}>
            <div className="k-top"><div className="k-icon"><Icon name={ic as never} /></div></div>
            <div className="k-value">{v}</div>
            <div className="k-foot"><span>{l}</span></div>
          </div>
        ))}
      </div>

      <div className="toolbar">
        <div className="search"><Icon name="search" /><input placeholder="Buscar por placa, motorista, rota ou empresa…" value={q} onChange={e => setQ(e.target.value)} /></div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Data</th><th>Placa / Motorista</th><th>Rota</th><th>Dist. (km)</th>
                <th>Combustível</th><th>Carga (kg)</th><th>CO₂ (kg)</th><th>Impacto</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(v => {
                const em = emissoesByViagem.get(v.id);
                const combNome = combustiveisById.get(v.combustivelId) ?? v.combustivelId;
                const rota = rotasById.get(v.rotaId);
                return (
                  <tr key={v.id}>
                    <td className="t-muted">{v.dataViagem}</td>
                    <td>
                      <div className="t-strong t-mono">{v.placa}</div>
                      <div className="t-muted" style={{ fontSize: 11 }}>{v.motorista}</div>
                    </td>
                    <td>
                      <div className="t-strong" style={{ fontSize: 12 }}>{rota?.nome || v.rota}</div>
                      <div className="t-muted" style={{ fontSize: 11 }}>{rota ? `${rota.origem} → ${rota.destino}` : v.empresa}</div>
                    </td>
                    <td className="t-mono">{fmt(v.distanciaPercorridaKm)}</td>
                    <td><Badge>{combNome}</Badge></td>
                    <td className="t-mono">{fmt(v.cargaTransportadaKg)}</td>
                    <td>
                      {em ? (
                        <span className="t-mono" style={{ fontWeight: 600, color: IMPACTO_COR[em.indiceImpactoAmbiental] ?? 'inherit' }}>
                          {fmt(em.co2EmitidoKg, 1)}
                        </span>
                      ) : <span className="t-muted">—</span>}
                    </td>
                    <td>
                      {em ? (
                        <span style={{ color: IMPACTO_COR[em.indiceImpactoAmbiental] ?? 'inherit', textTransform: 'capitalize', fontWeight: 600, fontSize: 12 }}>
                          {em.indiceImpactoAmbiental}
                        </span>
                      ) : <span className="t-muted">—</span>}
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="icon-btn" aria-label="Editar" onClick={() => { setFormError(''); setModal(v); }}><Icon name="edit" /></button>
                        <button className="icon-btn" aria-label="Excluir" onClick={() => setDel(v)}><Icon name="trash" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!filtered.length && <div className="empty"><Icon name="inbox" /><h4>Nenhuma viagem encontrada</h4><div>Registre viagens para calcular emissões automaticamente pelo backend.</div></div>}
      </div>

      {modal !== null && <ViagemForm inicial={modal} error={formError} onClose={() => setModal(null)} onSave={save} />}
      {del && <ConfirmDelete nome={`Viagem ${del.id}`} tipo="viagem" onCancel={() => setDel(null)} onConfirm={() => { const r = deleteViagem(del.id); if (r.ok) push(r.message ?? 'Viagem removida.', 'ok'); else push(r.error, 'warn'); setDel(null); }} />}
      {toastNode}
    </div>
  );
}
