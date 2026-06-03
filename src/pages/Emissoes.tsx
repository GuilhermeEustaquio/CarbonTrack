import { useMemo, useState } from 'react';
import { Icon } from '../components/icons/Icon';
import { CONSUMO_MEDIO_ESTIMADO_KM_POR_LITRO, fmt } from '../lib/constants';
import { getEmissoesAtivas } from '../lib/selectors';
import { useData } from '../context/DataContext';

const IMPACTO_COR: Record<string, string> = { baixo: 'var(--ok)', medio: 'var(--warn)', alto: 'var(--crit)' };

export function Emissoes() {
  const data = useData();
  const { viagens, rotas, combustiveis, mode } = data;
  const emissoes = useMemo(() => getEmissoesAtivas(data), [data]);
  const [q, setQ] = useState('');

  const viagemById = useMemo(() => {
    const map = new Map<string, typeof viagens[number]>();
    viagens.forEach(v => map.set(v.id, v));
    return map;
  }, [viagens]);

  const filtered = useMemo(() => emissoes.filter(e => {
    const v = viagemById.get(e.viagemId);
    return [e.viagemId, e.indiceImpactoAmbiental, e.dataCalculo, v?.placa, v?.motorista].join(' ').toLowerCase().includes(q.toLowerCase());
  }), [emissoes, viagemById, q]);

  const co2Total = filtered.reduce((s, e) => s + e.co2EmitidoKg, 0);
  const consumoTotal = filtered.reduce((s, e) => s + e.consumoEstimadoLitros, 0);

  return (
    <div className="view-enter">
      <div className="page-head">
        <div>
          <div className="eyebrow">Inventário · calculado pelo backend</div>
          <h1>Registros de <em>emissões</em></h1>
          <div className="sub">Emissões são geradas a partir das viagens. Esta tela é somente leitura e não possui cadastro manual.</div>
        </div>
      </div>


      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div className="eyebrow">Origem do consumo estimado</div>
        <div className="sub" style={{ marginTop: 6 }}>
          Cada emissão pertence a uma viagem. No modo local, o consumo estimado é calculado por distância ÷ {CONSUMO_MEDIO_ESTIMADO_KM_POR_LITRO} km/L e o CO₂ por consumo estimado × fator do combustível.
          {mode === 'api' ? ' No modo API, a API Java calcula e retorna esses registros.' : ' No backend real, esse cálculo será feito pela API Java.'}
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        {([
          ['Registros', filtered.length, 'var(--blue)', 'trend'],
          ['CO₂ total (kg)', fmt(co2Total, 1), 'var(--crit)', 'cloud'],
          ['Consumo estimado total (L)', fmt(consumoTotal, 1), 'var(--warn)', 'truck'],
          ['Impacto alto', filtered.filter(e => e.indiceImpactoAmbiental === 'alto').length, 'var(--crit)', 'flame'],
        ] as const).map(([l, v, c, ic]) => (
          <div className="kpi" key={l} style={{ '--accent': c } as React.CSSProperties}>
            <div className="k-top"><div className="k-icon"><Icon name={ic as never} /></div></div>
            <div className="k-value">{v}</div>
            <div className="k-foot"><span>{l}</span></div>
          </div>
        ))}
      </div>

      <div className="toolbar">
        <div className="search"><Icon name="search" /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Filtrar por viagem, impacto ou data…" /></div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Data cálculo</th><th>Viagem</th><th>Placa / Motorista</th><th>Rota / Combustível</th>
                <th>CO₂ (kg)</th><th>Consumo estimado (L)</th><th>Impacto</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => {
                const v = viagemById.get(e.viagemId);
                const rota = v ? rotas.find(r => r.id === v.rotaId) : undefined;
                const combustivel = v ? combustiveis.find(c => c.id === v.combustivelId) : undefined;
                return (
                  <tr key={e.id}>
                    <td className="t-muted">{e.dataCalculo}</td>
                    <td className="t-mono t-muted">{e.viagemId}</td>
                    <td>
                      {v ? (
                        <><div className="t-strong t-mono">{v.placa}</div><div className="t-muted" style={{ fontSize: 11 }}>{v.motorista} · {v.empresa}</div></>
                      ) : <span className="t-muted">—</span>}
                    </td>
                    <td>
                      {v ? (
                        <><div className="t-strong" style={{ fontSize: 12 }}>{rota?.nome || v.rota}</div><div className="t-muted" style={{ fontSize: 11 }}>{combustivel?.nome || v.combustivelId}</div></>
                      ) : <span className="t-muted">—</span>}
                    </td>
                    <td>
                      <span className="t-mono" style={{ fontWeight: 600, color: IMPACTO_COR[e.indiceImpactoAmbiental] ?? 'inherit' }}>
                        {fmt(e.co2EmitidoKg, 2)}
                      </span>
                    </td>
                    <td className="t-mono">{fmt(e.consumoEstimadoLitros, 2)}</td>
                    <td>
                      <span style={{ color: IMPACTO_COR[e.indiceImpactoAmbiental] ?? 'inherit', textTransform: 'capitalize', fontWeight: 600, fontSize: 12 }}>
                        {e.indiceImpactoAmbiental}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!filtered.length && (
          <div className="empty">
            <Icon name="inbox" />
            <h4>Nenhuma emissão registrada</h4>
            <div>Registre viagens na aba Viagens para que o backend calcule as emissões automaticamente.</div>
          </div>
        )}
      </div>
    </div>
  );
}
