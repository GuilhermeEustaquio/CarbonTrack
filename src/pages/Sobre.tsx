import { Icon, type IconName } from '../components/icons/Icon';

const steps: Array<{ title: string; text: string; icon: IconName }> = [
  { title: 'Empresas', icon: 'building', text: 'Cadastro da organização, CNPJ, setor, cidade, estado e responsável.' },
  { title: 'Frota', icon: 'truck', text: 'Caminhões vinculados às empresas, com placa, modelo, ano e capacidade de carga.' },
  { title: 'Motoristas', icon: 'user', text: 'Condutores vinculados às empresas, com CPF, número da CNH e validade.' },
  { title: 'Rotas', icon: 'pin', text: 'Trajetos com nome, origem, destino, distância, região e coordenadas no mapa.' },
  { title: 'Viagens', icon: 'trend', text: 'Registro operacional combinando caminhão, motorista, rota e combustível.' },
  { title: 'Emissões', icon: 'cloud', text: 'Cálculo automático de consumo estimado, CO₂ emitido e índice de impacto ambiental.' },
  { title: 'Alertas', icon: 'bell', text: 'Alertas automáticos quando há impacto ambiental médio ou alto.' },
  { title: 'Relatórios', icon: 'report', text: 'Ranking, indicadores, tendências e análise por período, rota e combustível.' },
];

const backendClasses = [
  ['Empresa', 'Base da operação, com CNPJ, setor, cidade, estado, responsável e data de cadastro.'],
  ['Caminhao', 'Frota vinculada à empresa, com placa, modelo livre, ano e capacidade de carga.'],
  ['Motorista', 'Condutor da operação, com CPF, número da CNH, validade e vínculo empresarial.'],
  ['Combustivel', 'Dado base com nome e fator de emissão de carbono usado no cálculo ambiental.'],
  ['Rota', 'Trajeto logístico com nome, origem, destino, distância, região e coordenadas.'],
  ['Viagem', 'Registro operacional com data, carga, distância, caminhão, motorista, rota e combustível.'],
  ['Emissao', 'Informação automática da viagem com consumo estimado, CO₂ emitido e impacto ambiental.'],
  ['AlertaAmbiental', 'Evento automático gerado quando o sistema identifica atenção ou impacto elevado.'],
];

const ods = [
  ['ODS 9', 'Indústria, inovação e infraestrutura'],
  ['ODS 11', 'Cidades e comunidades sustentáveis'],
  ['ODS 13', 'Ação contra a mudança global do clima'],
  ['ODS 8', 'Trabalho decente e crescimento econômico'],
  ['ODS 12', 'Consumo e produção responsáveis'],
];

const technologies = [
  ['React', 'interface SPA'],
  ['Vite', 'build rápido'],
  ['TypeScript', 'tipagem do front'],
  ['Tailwind CSS', 'base visual'],
  ['Leaflet / OpenStreetMap', 'mapas e rotas'],
  ['Java / Spring Boot', 'API preparada'],
  ['Oracle SQL', 'persistência preparada'],
  ['localStorage/mock mode', 'demonstração sem backend'],
];

export function Sobre() {
  return (
    <div className="view-enter sobre-page">
      <section className="sobre-hero card">
        <div className="sobre-hero-glow" />
        <div className="eyebrow">ECOORBIT SOLUTIONS · SOLUÇÃO CARBONTRACK</div>
        <h1 className="sobre-hero-title">CarbonTrack: logística, emissões e sustentabilidade em uma única plataforma.</h1>
        <p className="sobre-hero-sub">
          Uma solução de front-end preparada para integrar API Java/Spring Boot e Oracle SQL, permitindo que empresas de logística acompanhem rotas, viagens e emissões de CO₂ de forma clara e georreferenciada.
        </p>
        <div className="sobre-badges">
          <span className="badge teal"><span className="dot" />React/Vite</span>
          <span className="badge teal"><span className="dot" />API Java preparada</span>
          <span className="badge teal"><span className="dot" />Oracle SQL preparado</span>
          <span className="badge teal"><span className="dot" />Mapas georreferenciados</span>
        </div>
      </section>

      <section className="sobre-split">
        <article className="card sobre-story-card">
          <div className="sobre-card-icon crit"><Icon name="alert" /></div>
          <div className="eyebrow">O problema</div>
          <h2>Emissões logísticas ainda são difíceis de consolidar.</h2>
          <p>Empresas de transporte e logística geram emissões diariamente, mas muitas vezes não possuem uma visão integrada de frota, motoristas, rotas, viagens, combustível consumido e impacto ambiental. Isso dificulta acompanhar o CO₂ emitido, comparar desempenho e tomar decisões sustentáveis.</p>
        </article>

        <article className="card sobre-story-card">
          <div className="sobre-card-icon ok"><Icon name="leaf" /></div>
          <div className="eyebrow">A solução</div>
          <h2>Dados operacionais viram indicadores ambientais.</h2>
          <p>O CarbonTrack centraliza os dados operacionais da logística e transforma registros de viagens em indicadores ambientais. A partir de empresas, caminhões, motoristas, rotas e combustíveis, o sistema gera emissões automaticamente, cria alertas ambientais e apresenta relatórios para apoiar decisões ESG.</p>
        </article>
      </section>

      <SectionTitle eyebrow="Como funciona" title="Fluxo completo da operação ao relatório" sub="Cada etapa respeita o escopo logístico e prepara os dados para cálculo ambiental e análise executiva." />
      <section className="sobre-step-grid">
        {steps.map((step, index) => (
          <article className="card sobre-step-card" key={step.title}>
            <div className="sobre-step-top">
              <span className="sobre-step-number">{String(index + 1).padStart(2, '0')}</span>
              <span className="sobre-step-icon"><Icon name={step.icon} /></span>
            </div>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </article>
        ))}
      </section>

      <SectionTitle eyebrow="Classes do backend" title="Front alinhado ao contrato Java" sub="A interface preserva campos visuais para UX, mas o contrato principal segue as entidades previstas no backend." />
      <section className="sobre-entity-grid">
        {backendClasses.map(([name, text]) => (
          <article className="card sobre-entity-card" key={name}>
            <span className="sobre-entity-name">{name}</span>
            <p>{text}</p>
          </article>
        ))}
      </section>

      <section className="card sobre-integration-card">
        <div>
          <div className="eyebrow">Integração com API e Oracle</div>
          <h2>React/Vite → API Java/Spring Boot → Oracle SQL</h2>
          <p>O front-end foi preparado para operar em modo mock/localStorage para demonstração sem backend e em modo API real via <code>VITE_API_BASE_URL</code>. O front nunca conecta diretamente ao Oracle.</p>
          <p>Os dados são normalizados por adapters, IDs Long do backend são aceitos e convertidos para uso interno, e os payloads enviados para a API respeitam as classes Java sem enviar campos visuais do front.</p>
        </div>
        <div className="sobre-mode-grid">
          <div className="sobre-mode-card"><Icon name="inbox" /><b>Mock/localStorage</b><span>Demonstração funcional com dados locais e combustíveis base.</span></div>
          <div className="sobre-mode-card"><Icon name="zap" /><b>API real</b><span>Integração futura com endpoints Java por variável de ambiente.</span></div>
          <div className="sobre-mode-card"><Icon name="layers" /><b>Adapters</b><span>Normalização de nomes, datas, números e IDs recebidos da API.</span></div>
          <div className="sobre-mode-card"><Icon name="settings" /><b>Payloads</b><span>Envios limpos, compatíveis com as entidades Java oficiais.</span></div>
        </div>
      </section>

      <section className="card sobre-global-card">
        <div className="sobre-card-icon blue"><Icon name="globe" /></div>
        <div>
          <div className="eyebrow">Global Solution e economia espacial</div>
          <h2>Georreferenciamento aplicado a um problema real da Terra.</h2>
          <p>O CarbonTrack se conecta à Global Solution ao aplicar georreferenciamento, mapas e análise ambiental para enfrentar a emissão de CO₂ no transporte corporativo. O uso de mapas e rotas permite visualizar trajetos, apoiar análise logística e preparar a solução para integrações futuras com dados externos.</p>
          <p>Atualmente, os dados são simulados/localStorage no modo demonstração e preparados para integração com API Java.</p>
        </div>
      </section>

      <section className="grid-2b sobre-bottom-grid">
        <div className="card">
          <div className="card-head"><div><h3><Icon name="globe" /> ODS relacionados</h3><div className="ch-sub">Objetivos de Desenvolvimento Sustentável conectados à solução</div></div></div>
          <div className="card-body sobre-ods-grid">
            {ods.map(([code, label]) => <div className="ods-card" key={code}><b>{code}</b><span>{label}</span></div>)}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div><h3><Icon name="layers" /> Tecnologias</h3><div className="ch-sub">Stack usada ou preparada para a arquitetura final</div></div></div>
          <div className="card-body sobre-tech-grid">
            {technologies.map(([name, desc]) => <div className="sobre-stack-item" key={name}><span className="sobre-stack-label">{name}</span><span className="sobre-stack-desc">{desc}</span></div>)}
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionTitle({ eyebrow, title, sub }: { eyebrow: string; title: string; sub: string }) {
  return <div className="sobre-section-title"><div className="eyebrow">{eyebrow}</div><h2>{title}</h2><p>{sub}</p></div>;
}
