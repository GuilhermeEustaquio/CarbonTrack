import { Link } from 'react-router-dom';
import { Card } from '../components/ui';
import { Icon, type IconName } from '../components/icons/Icon';
import { fmt } from '../lib/constants';
import { useData } from '../context/DataContext';

const modules: Array<{ to: string; icon: IconName; title: string; text: string; meta: string }> = [
  { to: '/dashboard', icon: 'grid', title: 'Dashboard executivo', text: 'KPIs, ranking ambiental, tendência de emissão e alertas para uma visão rápida da operação.', meta: 'Visão geral' },
  { to: '/empresas', icon: 'building', title: 'Empresas', text: 'Cadastro de empresas com CNPJ, setor, localização, responsável e vínculo com a operação.', meta: 'Cadastro' },
  { to: '/caminhoes', icon: 'truck', title: 'Caminhões', text: 'Frota vinculada às empresas com placa, modelo livre, ano de fabricação e capacidade.', meta: 'Frota' },
  { to: '/motoristas', icon: 'user', title: 'Motoristas', text: 'Condutores por empresa com CPF, número da CNH e validade do documento.', meta: 'Equipe' },
  { to: '/rotas', icon: 'pin', title: 'Rotas', text: 'Rotas com nome, origem, destino, distância, região e coordenadas no mapa.', meta: 'Mapa' },
  { to: '/viagens', icon: 'trend', title: 'Viagens', text: 'Registro operacional usando caminhão, motorista, rota e combustível predefinido.', meta: 'Operação' },
  { to: '/emissoes', icon: 'cloud', title: 'Emissões automáticas', text: 'CO₂, consumo estimado e impacto ambiental gerados automaticamente a partir das viagens.', meta: 'CO₂' },
  { to: '/alertas', icon: 'bell', title: 'Alertas ambientais', text: 'Alertas automáticos para emissões elevadas e impacto ambiental médio ou alto.', meta: 'Prevenção' },
  { to: '/relatorios', icon: 'report', title: 'Relatórios', text: 'Indicadores, ranking ambiental, emissões por rota, combustível e período.', meta: 'Análise' },
];

const flow = [
  ['Empresas', 'cadastro base da operação'],
  ['Frota', 'caminhões e motoristas vinculados'],
  ['Rotas', 'trajetos com nome, distância e coordenadas'],
  ['Viagens', 'registro operacional do transporte'],
  ['Emissões', 'cálculo automático de CO₂'],
  ['Alertas', 'geração automática de alertas ambientais'],
  ['Relatórios', 'indicadores, ranking e tendência'],
];

const ods = [
  ['ODS 9', 'Indústria, inovação e infraestrutura'],
  ['ODS 11', 'Cidades e comunidades sustentáveis'],
  ['ODS 13', 'Ação contra a mudança global do clima'],
  ['ODS 8', 'Trabalho decente e crescimento econômico'],
  ['ODS 12', 'Consumo e produção responsáveis'],
];

export function Home() {
  const { empresas, caminhoes, rotas, viagens, emissoes, alertas } = useData();
  const caminhoesAtivos = caminhoes.filter(c => c.ativo !== false).length;
  const rotasAtivas = rotas.filter(r => r.ativo !== false).length;
  const co2TotalKg = emissoes.reduce((s, e) => s + e.co2EmitidoKg, 0);
  const alertasAtivos = alertas.filter(a => !a.resolvido).length;

  return <div className="view-enter home-page">
    <section className="home-hero card">
      <div className="home-hero-copy">
        <div className="eyebrow">ECOORBIT SOLUTIONS · GLOBAL SOLUTION 2026/1</div>
        <h1>CarbonTrack monitora <em>emissões logísticas</em> com mapas, dados e visão ambiental.</h1>
        <p>Plataforma digital para cadastrar empresas, frota, motoristas, rotas e viagens, calculando CO₂ automaticamente e preparando o front-end para consumir uma API Java/Spring Boot integrada ao Oracle SQL.</p>
        <div className="head-actions">
          <Link className="btn primary" to="/dashboard"><Icon name="grid" />Abrir dashboard</Link>
          <Link className="btn" to="/viagens"><Icon name="truck" />Registrar viagem</Link>
          <Link className="btn" to="/rotas"><Icon name="pin" />Ver rotas</Link>
          <Link className="btn ghost" to="/sobre"><Icon name="info" />Sobre / Solução</Link>
        </div>
      </div>
      <div className="home-metrics" aria-label="Métricas da plataforma">
        <Metric value={empresas.length} label="empresas cadastradas" icon="building" />
        <Metric value={caminhoesAtivos} label="caminhões monitorados" icon="truck" />
        <Metric value={rotasAtivas} label="rotas cadastradas" icon="pin" />
        <Metric value={viagens.length} label="viagens registradas" icon="trend" />
        <Metric value={fmt(co2TotalKg, 1)} label="kg CO₂ calculado" icon="cloud" />
        <Metric value={alertasAtivos} label="alertas ambientais" icon="bell" />
      </div>
    </section>

    <div className="grid-2 info-grid">
      <Card title="O problema que resolvemos" icon="alert" sub="Dados logísticos dispersos dificultam a gestão ambiental">
        <p style={{ margin: 0, color: 'var(--text-2)', lineHeight: 1.7 }}>Empresas de logística e transporte precisam consolidar dados de frota, rotas, viagens, combustível e emissões em uma única visão. Sem isso, o impacto ambiental fica difícil de medir, comparar e reduzir.</p>
      </Card>
      <Card title="Como o CarbonTrack funciona" icon="trend" sub="Fluxo do cadastro ao indicador ambiental">
        <p style={{ margin: 0, color: 'var(--text-2)', lineHeight: 1.7 }}>O sistema conecta empresas, caminhões, motoristas, rotas e viagens. A partir dos dados registrados, calcula emissões de CO₂, gera alertas ambientais e organiza relatórios para tomada de decisão.</p>
      </Card>
    </div>

    <SectionTitle eyebrow="Módulos da plataforma" title="Do cadastro ao relatório" sub="Fluxo completo para transformar dados logísticos em indicadores ambientais." />
    <div className="module-grid">{modules.map(module => <ModuleCard key={module.to} {...module} />)}</div>

    <Card title="Fluxo do CarbonTrack" icon="trend" sub="Empresas → frota → rotas → viagens → emissões → alertas → relatórios">
      <div className="home-flow">{flow.map(([title, text], index) => <div className="step" key={title}><span className="badge teal"><span className="dot" />{String(index + 1).padStart(2, '0')}</span><b>{title}</b><span>{text}</span></div>)}</div>
    </Card>

    <div className="grid-2 info-grid">
      <Card title="Conexão com a Global Solution" icon="globe" sub="Economia espacial aplicada às emissões logísticas">
        <p style={{ margin: 0, color: 'var(--text-2)', lineHeight: 1.7 }}>O CarbonTrack aplica o conceito de economia espacial ao usar georreferenciamento, mapas e análise ambiental para apoiar decisões sobre emissões logísticas. A arquitetura está preparada para integração com API Java/Spring Boot e Oracle SQL, mantendo dados locais em mock/localStorage para demonstração.</p>
      </Card>
      <Card title="ODS relacionados" icon="leaf" sub="Impacto social, ambiental e econômico">
        <div className="ods-grid">{ods.map(([code, label]) => <div className="ods-card" key={code}><b>{code}</b><span>{label}</span></div>)}</div>
      </Card>
    </div>
  </div>;
}

function SectionTitle({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return <div className="section-title"><div className="eyebrow">{eyebrow}</div><h2 className="display">{title}</h2>{sub && <p style={{ margin: '8px 0 0', color: 'var(--text-2)', lineHeight: 1.6 }}>{sub}</p>}</div>;
}

function Metric({ value, label, icon }: { value: string | number; label: string; icon: IconName }) {
  return <div className="home-metric"><Icon name={icon} /><strong>{value}</strong><span>{label}</span></div>;
}

function ModuleCard({ to, icon, title, text, meta }: { to: string; icon: IconName; title: string; text: string; meta: string }) {
  return <Link className="card module-card" to={to}><div className="module-card-icon"><Icon name={icon} /></div><div><span className="eyebrow">{meta}</span><h3>{title}</h3><p>{text}</p></div><span className="module-card-link">Abrir módulo <Icon name="arrowRight" /></span></Link>;
}
