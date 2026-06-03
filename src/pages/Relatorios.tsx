import { useMemo, useState } from 'react';
import { Icon } from '../components/icons/Icon';
import { Card, Field } from '../components/ui';
import { fmt } from '../lib/constants';
import {
  getCo2MensalUltimos6,
  getCo2PorCombustivel,
  getCo2PorRota,
  getDashboardMetrics,
  getEmissoesAtivas,
  getRankingAmbiental,
} from '../lib/selectors';
import { useData } from '../context/DataContext';
import { AreaChart } from '../components/charts';

export function Relatorios() {
  const data = useData();
  const { empresas, viagens } = data;
  const [empresa, setEmpresa] = useState('todas');
  const [periodo, setPeriodo] = useState(new Date().toISOString().slice(0, 7));

  const rows = useMemo(() =>
    getEmissoesAtivas(data).filter(e => {
      const v = viagens.find(vg => vg.id === e.viagemId);
      const matchesEmpresa = empresa === 'todas' || v?.empresaId === empresa;
      const matchesPeriodo = !periodo || e.dataCalculo?.startsWith(periodo);
      return matchesEmpresa && matchesPeriodo;
    }),
    [data, empresa, periodo, viagens]
  );

  const filteredDb = useMemo(() => ({ ...data, emissoes: rows }), [data, rows]);
  const metrics = useMemo(() => getDashboardMetrics(filteredDb), [filteredDb]);
  const serieMensal = useMemo(() => getCo2MensalUltimos6(data), [data]);
  const co2PorRota = useMemo(() => getCo2PorRota(filteredDb).slice(0, 5), [filteredDb]);
  const co2PorCombustivel = useMemo(() => getCo2PorCombustivel(filteredDb).slice(0, 5), [filteredDb]);
  const ranking = useMemo(() => getRankingAmbiental(filteredDb).filter(item => item.co2Kg > 0).slice(0, 5), [filteredDb]);

  const consumoTotal = rows.reduce((s, e) => s + e.consumoEstimadoLitros, 0);
  const previsao = serieMensal.dataTon.length ? Number((serieMensal.dataTon[serieMensal.dataTon.length - 1] * 1.08).toFixed(2)) : 0;

  const csv = () => {
    const header = 'id,viagemId,co2EmitidoKg,consumoEstimadoLitros,indiceImpactoAmbiental,dataCalculo';
    const dataCsv = [header, ...rows.map(r => [r.id, r.viagemId, r.co2EmitidoKg, r.consumoEstimadoLitros, r.indiceImpactoAmbiental, r.dataCalculo].join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([dataCsv], { type: 'text/csv' }));
    a.download = `carbontrack-emissoes-${periodo || 'todos'}.csv`;
    a.click();
  };

  return (
    <div className="view-enter">
      <div className="page-head">
        <div>
          <div className="eyebrow">Relatórios · CSV e impressão</div>
          <h1>Relatórios <em>de emissões</em></h1>
          <div className="sub">Análise consolidada usando a mesma fonte do Dashboard: emissões únicas vinculadas às viagens, com filtros por empresa e período.</div>
        </div>
        <div className="head-actions">
          <button className="btn" onClick={csv}><Icon name="download" />Exportar CSV</button>
          <button className="btn" onClick={() => print()}><Icon name="report" />Imprimir</button>
        </div>
      </div>

      <section className="card report-filter-card">
        <div>
          <div className="eyebrow">Filtros do relatório</div>
          <p style={{ margin: '5px 0 0', color: 'var(--text-3)' }}>Filtre por empresa e período para gerar o recorte desejado.</p>
        </div>
        <div className="report-filter-fields">
          <Field label="Empresa"><select value={empresa} onChange={e => setEmpresa(e.target.value)}><option value="todas">Todas as empresas</option>{empresas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}</select></Field>
          <Field label="Período"><input type="month" value={periodo} onChange={e => setPeriodo(e.target.value)} /></Field>
        </div>
      </section>

      <div className="kpi-grid">
        <div className="kpi" style={{ '--accent': 'var(--crit)' } as React.CSSProperties}><div className="k-value">{fmt(metrics.co2TotalKg, 1)}<small>kg CO₂</small></div><div className="k-foot">CO₂ total filtrado</div></div>
        <div className="kpi" style={{ '--accent': 'var(--blue)' } as React.CSSProperties}><div className="k-value">{metrics.emissoesRegistradas}</div><div className="k-foot">Emissões únicas filtradas</div></div>
        <div className="kpi" style={{ '--accent': 'var(--teal)' } as React.CSSProperties}><div className="k-value">{fmt(consumoTotal, 1)}<small>L</small></div><div className="k-foot">Consumo estimado</div></div>
        <div className="kpi" style={{ '--accent': 'var(--warn)' } as React.CSSProperties}><div className="k-value">{rows.filter(e => e.indiceImpactoAmbiental === 'alto').length}</div><div className="k-foot">Impacto alto</div></div>
      </div>

      <Card title="Série mensal de CO₂ (t)" icon="trend" sub="Emissões únicas por viagem — últimos 6 meses">
        {getEmissoesAtivas(data).length > 0 ? (
          <AreaChart labels={serieMensal.labels} meta={0} series={[{ name: 'CO₂ (t)', data: serieMensal.dataTon, color: 'var(--teal)' }]} />
        ) : (
          <div className="empty" style={{ paddingTop: 40 }}><Icon name="trend" /><div>Nenhuma emissão registrada.</div></div>
        )}
      </Card>

      <div className="grid-2" style={{ marginTop: 16 }}>
        <Card title="Emissões por empresa" icon="building" sub="Ranking ambiental no recorte filtrado">
          {ranking.length ? ranking.map(item => <div className="flow-step" key={item.empresa.id}><b>{item.empresa.nome}</b><span>{fmt(item.co2Kg, 1)} kg CO₂</span></div>) : <div className="empty">Sem dados por empresa.</div>}
        </Card>
        <Card title="Emissões por rota" icon="pin" sub="Ranking ambiental das rotas logísticas">
          {co2PorRota.length ? co2PorRota.map(item => <div className="flow-step" key={item.id}><b>{item.nome}</b><span>{fmt(item.co2Kg, 1)} kg CO₂</span></div>) : <div className="empty">Sem dados por rota.</div>}
        </Card>
      </div>

      <div className="grid-2" style={{ marginTop: 16 }}>
        <Card title="Emissões por combustível" icon="truck" sub="Distribuição por fator de emissão">
          {co2PorCombustivel.length ? co2PorCombustivel.map(item => <div className="flow-step" key={item.id}><b>{item.nome}</b><span>{fmt(item.co2Kg, 1)} kg CO₂</span></div>) : <div className="empty">Sem dados por combustível.</div>}
        </Card>
        <section className="card" style={{ padding: 24 }}>
          <div className="eyebrow">Previsão simulada até integração com modelo de IA</div>
          <h3>Tendência prevista para o próximo mês: {fmt(previsao, 2)} t CO₂</h3>
          <p style={{ color: 'var(--text-2)' }}>Projeção simples de demonstração baseada no último mês acrescido de 8%, sem prometer modelo preditivo real antes da integração.</p>
        </section>
      </div>

      <section className="card report-table-card" style={{ marginTop: 16 }}>
        <div className="card-head"><div><h3><Icon name="report" /> Registros exportáveis</h3><div className="ch-sub">Emissões únicas por viagem — somente leitura</div></div></div>
        <div className="table-wrap">
          <table className="tbl">
            <thead><tr><th>Data cálculo</th><th>Viagem</th><th>CO₂ (kg)</th><th>Consumo estimado (L)</th><th>Impacto</th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td>{r.dataCalculo}</td>
                  <td className="t-mono t-muted">{r.viagemId}</td>
                  <td className="t-mono">{fmt(r.co2EmitidoKg, 2)}</td>
                  <td className="t-mono">{fmt(r.consumoEstimadoLitros, 2)}</td>
                  <td style={{ textTransform: 'capitalize' }}>{r.indiceImpactoAmbiental}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && <div className="empty"><Icon name="inbox" /><h4>Nenhum registro</h4></div>}
      </section>
    </div>
  );
}
