import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Icon, type IconName } from '../components/icons/Icon';
import { useTheme } from '../hooks/useTheme';
import { useToasts } from '../hooks/useToasts';
import { useData } from '../context/DataContext';
import { getDashboardMetrics } from '../lib/selectors';

type NavItem = { to: string; label: string; icon: IconName; count?: number };
const NAV_MAIN_BASE: NavItem[] = [
  { to: '/', label: 'Home', icon: 'globe' },
  { to: '/dashboard', label: 'Dashboard ESG', icon: 'grid' },
  { to: '/empresas', label: 'Empresas', icon: 'building' },
];
const NAV_LOGISTICA: NavItem[] = [
  { to: '/caminhoes', label: 'Caminhões', icon: 'truck' },
  { to: '/motoristas', label: 'Motoristas', icon: 'user' },
  { to: '/rotas', label: 'Rotas', icon: 'pin' },
  { to: '/viagens', label: 'Viagens', icon: 'trend' },
];
const NAV_MVP: NavItem[] = [
  { to: '/emissoes', label: 'Emissões', icon: 'cloud' },
  { to: '/alertas', label: 'Alertas', icon: 'bell' },
  { to: '/relatorios', label: 'Relatórios', icon: 'report' },
];
const NAV_INFO: NavItem[] = [
  { to: '/sobre', label: 'Sobre / Solução', icon: 'info' },
  { to: '/integrantes', label: 'Integrantes', icon: 'user' },
  { to: '/faq', label: 'FAQ', icon: 'info' },
  { to: '/contato', label: 'Contato', icon: 'inbox' },
];

function Brand() { return <div className="brand"><div className="mark"><Icon name="leaf" style={{ color: 'oklch(0.18 0.02 240)' }} /></div><div className="name">Carbon<span>Track</span></div></div>; }
function NavGroup({ label, items, onNavigate }: { label: string; items: NavItem[]; onNavigate: () => void }) { return <><div className="nav-label">{label}</div>{items.map(item => <NavLink end={item.to === '/'} key={item.to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} to={item.to} onClick={onNavigate} title={item.label}><Icon name={item.icon} /><span className="label">{item.label}</span>{item.count != null && <span className="count">{item.count}</span>}</NavLink>)}</>; }

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const { theme, toggle } = useTheme();
  const [push, toastNode] = useToasts();
  const nav = useNavigate();
  const data = useData();
  const { mode, modeLabel, loading, lastUpdatedAt } = data;
  const metrics = getDashboardMetrics(data);
  const navMain = NAV_MAIN_BASE.map(item => item.to === '/empresas' ? { ...item, count: metrics.empresasAtivas } : item);
  const navLogistica = NAV_LOGISTICA.map(item =>
    item.to === '/caminhoes' ? { ...item, count: metrics.caminhoesAtivos } :
    item.to === '/motoristas' ? { ...item, count: metrics.motoristasAtivos } :
    item.to === '/rotas' ? { ...item, count: metrics.rotasAtivas } :
    item.to === '/viagens' ? { ...item, count: metrics.viagensRegistradas } :
    item
  );
  const navMvp = NAV_MVP.map(item =>
    item.to === '/emissoes' ? { ...item, count: metrics.emissoesRegistradas } :
    item.to === '/alertas' ? { ...item, count: metrics.alertasAtivos } :
    item
  );
  const coletaTitle = loading ? 'Sincronizando' : modeLabel.startsWith('Modo local') ? 'Modo local forçado' : modeLabel.startsWith('API conectada') ? 'API conectada' : modeLabel.startsWith('API indisponível') ? 'API indisponível' : 'Coleta local ativa';
  const coletaText = loading ? 'Buscando dados da API' : modeLabel.startsWith('Modo local') ? 'VITE_FORCE_MOCK=true' : modeLabel.startsWith('API conectada') ? 'Sincronizando com backend Java' : modeLabel.startsWith('API indisponível') ? 'Usando cache/localStorage' : 'Dados em mock/localStorage';
  const coletaSub = loading ? 'Aguarde atualização dos indicadores' : modeLabel.startsWith('Modo local') ? 'API ignorada · dados locais' : modeLabel.startsWith('API conectada') ? 'VITE_API_BASE_URL ativo' : modeLabel.startsWith('API indisponível') ? 'Verifique o backend Java' : 'Sem API configurada · cálculos simulados no front';
  const coletaAtualizada = new Date(lastUpdatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const closeMobile = () => setMobile(false);
  return <div className={`app ${collapsed ? 'collapsed' : ''} ${mobile ? 'mobile-open' : ''}`}>
    <aside className="sidebar">
      <Brand />
      <nav className="nav" aria-label="Navegação principal">
        <NavGroup label="Principal" items={navMain} onNavigate={closeMobile} />
        <NavGroup label="Logística" items={navLogistica} onNavigate={closeMobile} />
        <NavGroup label="Monitoramento" items={navMvp} onNavigate={closeMobile} />
        <NavGroup label="Institucional" items={NAV_INFO} onNavigate={closeMobile} />
      </nav>
      <div className="side-foot"><div className="side-card"><div className="sc-top"><span className="live-dot" /><span className="sc-title">{coletaTitle}</span></div><div className="sc-sub"><b>{coletaText}</b><br />{coletaSub}<br />{metrics.empresasAtivas} empresas · {metrics.caminhoesAtivos} caminhões · {metrics.viagensRegistradas} viagens · {metrics.emissoesRegistradas} emissões<br />CO₂ derivado de emissões por viagem · atualizado {coletaAtualizada}</div></div></div>
    </aside>
    <div className="main">
      <header className="topbar">
        <button className="icon-btn mobile-menu" onClick={() => setMobile(v => !v)} title="Abrir menu" aria-label="Abrir menu"><Icon name="sliders" /></button>
        <button className="icon-btn desktop-collapse" onClick={() => setCollapsed(c => !c)} title="Recolher menu" aria-label="Recolher menu"><Icon name="sliders" /></button>
        <div className="search"><Icon name="search" /><input aria-label="Buscar" placeholder="Buscar empresas, rotas, viagens, alertas…" onKeyDown={e => { if (e.key === 'Enter') { push('Busca global em protótipo: abrindo relatórios consolidados.', 'info'); nav('/relatorios'); } }} /><kbd>⌘K</kbd></div>
        <div className="spacer" />
        <button className="icon-btn" title="Alternar tema" aria-label="Alternar tema" onClick={toggle}><Icon name={theme === 'dark' ? 'sun' : 'moon'} /></button>
        <button className="icon-btn" title="Alertas" aria-label="Alertas" onClick={() => nav('/alertas')}><Icon name="bell" /><span className="badge-dot" /></button>
        <button className="icon-btn" title="Sobre o sistema" aria-label="Sobre o sistema" onClick={() => nav('/sobre')}><Icon name="info" /></button>
        <div className="user"><div className="av">GS</div><div className="u-meta"><b>Guilherme S.</b><span>Gestor ambiental</span></div></div>
      </header>
      <main className="content"><div className="content-inner"><Outlet /></div></main>
    </div>
    {mobile && <button className="mobile-backdrop" onClick={closeMobile} aria-label="Fechar menu" />}
    {toastNode}
  </div>;
}