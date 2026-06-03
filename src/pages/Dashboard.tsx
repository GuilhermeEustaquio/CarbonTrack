import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/icons/Icon';
import { AreaChart, BarList, Donut } from '../components/charts';
import { Card, Logo, StatusBadge } from '../components/ui';
import { fmt } from '../lib/constants';
import {
  getAlertasAtivos,
  getCo2MensalUltimos6,
  getCo2PorRota,
  getDashboardMetrics,
  getEmissoesPorEmpresa,
} from '../lib/selectors';
import { useData } from '../context/DataContext';

export function Dashboard() {
  const data = useData();
  const { empresas, alertas, caminhoes, motoristas, rotas } = data;
  const metrics = useMemo(() => getDashboardMetrics(data), [data]);
  const serieMensal = useMemo(() => getCo2MensalUltimos6(data), [data]);
  const co2PorEmpresa = useMemo(() => getEmissoesPorEmpresa(data), [data]);
  const rotasRanking = useMemo(() => getCo2PorRota(data).slice(0, 5), [data]);
  const alertasAtivos = useMemo(() => getAlertasAtivos(data), [data]);

  const donutData = useMemo(() => {
    const total = metrics.co2TotalKg || 1;
    return metrics.rankingAmbiental
      .filter(item => item.co2Kg > 0)
      .slice(0, 5)
      .map((item, i) => ({
        nome: item.empresa.nome,
        valor: Math.round(item.co2Kg / total * 100),
        cor: ['var(--teal)', 'var(--blue)', 'var(--warn)', 'var(--ok)', 'var(--crit)'][i % 5],
      }));
  }, [metrics]);

  const maisPolui = metrics.rankingAmbiental.find(item => item.co2Kg > 0) ?? metrics.rankingAmbiental[0];

  return (
    <div className="view-enter">
      <div className="page-head">
        <div>
          <div className="eyebrow">Visão geral · {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</div>
          <h1>Painel <em>ESG</em> · CarbonTrack</h1>
          <div className="sub">Indicadores derivados de empresas, frota, rotas, viagens, emissões e alertas — sem usar unidades ou ações antigas como fonte principal.</div>
        </div>
        <div className="head-actions">
          <Link className="btn" to="/relatorios"><Icon name="download" />Exportar</Link>
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        {([
          ['Empresas ativas', metrics.empresasAtivas, 'var(--blue)', 'building'],
          ['Viagens registradas', metrics.viagensRegistradas, 'var(--teal)', 'truck'],
          ['CO₂ total (kg)', fmt(metrics.co2TotalKg, 1), 'var(--crit)', 'cloud'],
          ['Alertas ativos', metrics.alertasAtivos, 'var(--warn)', 'bell'],
        ] as const).map(([l, v, c, ic]) => (
          <div className="kpi" key={l} style={{ '--accent': c } as React.CSSProperties}>
            <div className="k-top"><div className="k-icon"><Icon name={ic as never} /></div></div>
            <div className="k-value">{v}</div>
            <div className="k-foot"><span>{l}</span></div>
          </div>
        ))}
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginTop: 0 }}>
        {([
          ['Emissões únicas', metrics.emissoesRegistradas, 'var(--blue)', 'trend'],
          ['Caminhões ativos', metrics.caminhoesAtivos, 'var(--teal)', 'truck'],
          ['Motoristas ativos', metrics.motoristasAtivos, 'var(--ok)', 'user'],
          ['Rotas ativas', metrics.rotasAtivas, 'var(--blue)', 'pin'],
        ] as const).map(([l, v, c, ic]) => (
          <div className="kpi" key={l} style={{ '--accent': c } as React.CSSProperties}>
            <div className="k-top"><div className="k-icon"><Icon name={ic as never} /></div></div>
            <div className="k-value">{v}</div>
            <div className="k-foot"><span>{l}</span></div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <Card title="Evolução das emissões (t CO₂)" icon="trend" sub="Soma das emissões únicas por viagem — últimos 6 meses">
          {metrics.emissoesRegistradas > 0 ? (
            <AreaChart labels={serieMensal.labels} meta={0} series={[{ name: 'CO₂ (t)', data: serieMensal.dataTon, color: 'var(--teal)' }]} />
          ) : (
            <div className="empty" style={{ paddingTop: 40 }}><Icon name="trend" /><div>Registre viagens para ver as emissões ao longo do tempo.</div></div>
          )}
        </Card>
        <Card title="Emissões por empresa" icon="layers" sub="Distribuição percentual do CO₂ derivado das viagens">
          {donutData.length > 0 ? (
            <div className="donut-wrap">
              <Donut data={donutData} center={{ v: fmt(metrics.co2TotalKg / 1000, 1), l: 't CO₂' }} />
              <div style={{ flex: 1, minWidth: 0 }}><BarList data={donutData} /></div>
            </div>
          ) : (
            <div className="empty" style={{ paddingTop: 40 }}><Icon name="layers" /><div>Nenhuma emissão registrada ainda.</div></div>
          )}
        </Card>
      </div>

      <div className="grid-2">
        <Card title="Ranking ESG — Empresas monitoradas" icon="building" sub="Ordenado por CO₂ derivado das emissões vinculadas às viagens" action={<Link className="btn sm ghost" to="/empresas">Ver todas<Icon name="arrowRight" /></Link>}>
          <div className="table-wrap" style={{ margin: '-18px' }}>
            <table className="tbl">
              <thead><tr><th>#</th><th>Empresa</th><th>Setor</th><th>Emissão</th><th>Meta</th><th>Status</th></tr></thead>
              <tbody>
                {metrics.rankingAmbiental.length > 0 ? metrics.rankingAmbiental.slice(0, 5).map((item, i) => {
                  const e = item.empresa;
                  const pct = item.pctMeta ?? 0;
                  return (
                    <tr key={e.id}>
                      <td className="t-mono t-muted" style={{ width: 32 }}>{i + 1}</td>
                      <td><div className="cell-co"><Logo sigla={e.sigla} cor={e.cor} size={30} /><span className="t-strong">{e.nome}</span></div></td>
                      <td className="t-muted">{e.setor}</td>
                      <td className="t-mono">{fmt(item.co2T, 2)} t</td>
                      <td><div className="mini-meter"><div className="track"><div className="fill" style={{ width: `${Math.min(100, pct)}%`, background: item.status === 'critico' ? 'var(--crit)' : item.status === 'atencao' ? 'var(--warn)' : 'var(--ok)' }} /></div><span className="pct">{item.pctMeta == null ? 'faixa' : `${pct}%`}</span></div></td>
                      <td><StatusBadge status={item.status} /></td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan={6} className="t-muted" style={{ textAlign: 'center', padding: 24 }}>Nenhuma empresa cadastrada ainda.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Alertas recentes" icon="bell" sub="Alertas automáticos de impacto médio/alto" action={<Link className="btn sm ghost" to="/alertas">Central<Icon name="arrowRight" /></Link>}>
          <div className="alerts">
            {alertasAtivos.slice(0, 5).map(a => (
              <Link to="/alertas" className={`alert-item ${a.nivel === 'critico' ? 'crit' : a.nivel === 'atencao' ? 'warn' : 'ok'}`} key={a.id}>
                <div className="ai"><Icon name={a.nivel === 'critico' ? 'flame' : a.nivel === 'atencao' ? 'alert' : 'info'} /></div>
                <div>
                  <b>{a.tipo}</b>
                  <span>{a.empresa ?? a.empresaId}</span>
                  <small>{a.descricao} · {a.dataGeracao}</small>
                </div>
              </Link>
            ))}
            {alertasAtivos.length === 0 && <div className="empty" style={{ paddingTop: 24 }}><Icon name="bell" /><div>Nenhum alerta ativo registrado.</div></div>}
          </div>
        </Card>
      </div>

      <div className="grid-2">
        <Card title="Destaques ESG — Frota logística" icon="truck" sub="Indicadores derivados da fonte única de emissões">
          <div style={{ display: 'grid', gap: 12 }}>
            {maisPolui && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'oklch(0.22 0.05 15 / 0.15)', borderRadius: 8, border: '1px solid oklch(0.35 0.1 15 / 0.25)' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Empresa com maior emissão em viagens</div>
                  <div style={{ fontWeight: 700, marginTop: 2 }}>{maisPolui.empresa.nome}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: 'var(--crit)' }}>{fmt(co2PorEmpresa.get(maisPolui.empresa.id) ?? 0, 1)} kg CO₂</div>
                  <Link to="/viagens" style={{ fontSize: 11, color: 'var(--teal)' }}>Ver viagens →</Link>
                </div>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {([
                [caminhoes.filter(c => c.ativo !== false).length, 'Caminhões', '/caminhoes'],
                [motoristas.filter(m => m.ativo !== false).length, 'Motoristas', '/motoristas'],
                [rotas.filter(r => r.ativo !== false).length, 'Rotas', '/rotas'],
              ] as const).map(([v, l, to]) => (
                <Link to={to} key={l} style={{ textAlign: 'center', padding: 12, background: 'var(--surface-2)', borderRadius: 8, textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{v}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{l}</div>
                </Link>
              ))}
            </div>
          </div>
        </Card>

        <Card title="Rotas com maior emissão" icon="pin" sub="CO₂ por rota calculado pelas viagens vinculadas">
          <div style={{ display: 'grid', gap: 8 }}>
            {rotasRanking.length ? rotasRanking.map(item => (
              <div key={item.id} className="flow-step"><b>{item.nome}</b><span>{fmt(item.co2Kg, 1)} kg CO₂</span></div>
            )) : <div className="empty"><Icon name="pin" /><div>Nenhuma rota com emissão registrada.</div></div>}
          </div>
        </Card>
      </div>
    </div>
  );
}
