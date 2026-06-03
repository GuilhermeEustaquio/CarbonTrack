import { useState } from 'react';
import { Icon, type IconName } from '../components/icons/Icon';

type FAQItem = { question: string; answer: string };
type FAQCategory = { title: string; icon: IconName; items: FAQItem[] };

const categories: FAQCategory[] = [
  {
    title: 'Sobre o projeto',
    icon: 'building',
    items: [
      { question: 'O que é o CarbonTrack?', answer: 'É uma SPA para monitorar emissões logísticas. Ela organiza empresas, caminhões, motoristas, combustíveis, rotas, viagens, emissões, alertas e relatórios em uma experiência preparada para API Java.' },
      { question: 'Qual problema o sistema resolve?', answer: 'Ele reduz a fragmentação de dados no transporte. Em vez de planilhas isoladas, a equipe visualiza frota, rotas, viagens, CO₂, alertas e ranking ambiental no mesmo front-end.' },
      { question: 'Como empresas podem usar o CarbonTrack?', answer: 'A empresa cadastra sua frota, motoristas e rotas, registra viagens e acompanha o cálculo automático de consumo estimado, CO₂ emitido e impacto ambiental.' },
    ],
  },
  {
    title: 'Mapas e economia espacial',
    icon: 'pin',
    items: [
      { question: 'Como o sistema se conecta ao tema da economia espacial?', answer: 'A conexão ocorre pelo uso de mapas, coordenadas e rotas georreferenciadas para monitorar um problema real da Terra: emissões do transporte logístico.' },
      { question: 'Os mapas são reais?', answer: 'O mapa usa tiles públicos reais (OpenStreetMap/CARTO). As rotas podem ser simuladas localmente ou vir da API Java com nome, origem, destino, distância, região e coordenadas.' },
      { question: 'O mapa substitui origem e destino por coordenadas?', answer: 'Não. Origem e destino continuam sendo textos humanos, como São Paulo - SP e Campinas - SP. O mapa preenche apenas origemLat, origemLon, destinoLat e destinoLon.' },
    ],
  },
  {
    title: 'Emissões, alertas e relatórios',
    icon: 'cloud',
    items: [
      { question: 'Como as emissões são calculadas?', answer: 'No backend real, elas vêm de regras da API. No modo mock, consumoEstimadoLitros = distanciaPercorridaKm / 3 e co2EmitidoKg = consumo × fator do combustível.' },
      { question: 'Como os alertas são gerados?', answer: 'Alertas são gerados automaticamente quando uma viagem resulta em impacto médio ou alto. A tela de Alertas é visualização, não cadastro manual.' },
      { question: 'O que os relatórios entregam?', answer: 'Relatórios mostram emissões por empresa, rota, combustível e período, ranking ambiental e uma tendência simulada até futura integração com modelo de IA.' },
    ],
  },
  {
    title: 'Integração e deploy',
    icon: 'trend',
    items: [
      { question: 'Como configurar a API Java?', answer: 'Defina VITE_API_BASE_URL com a URL do backend Spring Boot. O fluxo correto é React/Vite → API Java/Spring Boot → Oracle SQL.' },
      { question: 'O front conecta direto ao Oracle?', answer: 'Não. O front nunca conecta diretamente no Oracle; ele consome apenas a API Java.' },
      { question: 'Como manter a demonstração sem backend?', answer: 'Use o modo mock/localStorage. VITE_FORCE_MOCK=true força dados locais, incluindo combustíveis seed para o select de Viagens.' },
      { question: 'Quais ODS o projeto atende?', answer: 'O projeto se relaciona principalmente com ODS 9, 11, 12 e 13: inovação, cidades sustentáveis, produção responsável e ação climática.' },
    ],
  },
];

function FAQItem({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className={`faq-item card ${isOpen ? 'faq-item-open' : ''}`}>
      <button className="faq-question" onClick={onToggle} aria-expanded={isOpen}>
        <span>{item.question}</span>
        <span className={`faq-chevron ${isOpen ? 'faq-chevron-open' : ''}`}>
          <Icon name="chevDown" />
        </span>
      </button>
      {isOpen && (
        <div className="faq-answer">
          <p>{item.answer}</p>
        </div>
      )}
    </div>
  );
}

export function FAQ() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggle = (key: string) => setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="view-enter faq-page">

      <div className="page-head">
        <div>
          <div className="eyebrow">Perguntas frequentes</div>
          <h1>FAQ <em>CarbonTrack</em></h1>
          <div className="sub">Tudo sobre o escopo, a integração com API e a conexão com a Global Solution.</div>
        </div>
      </div>

      <div className="faq-intro card">
        <div className="faq-intro-inner">
          <div className="faq-intro-icon"><Icon name="info" /></div>
          <div>
            <strong>Como usar o FAQ</strong>
            <span>Clique em qualquer pergunta para expandir a resposta. As categorias cobrem desde o conceito do projeto até a configuração de deploy.</span>
          </div>
        </div>
      </div>

      <div className="faq-categories">
        {categories.map(cat => (
          <section key={cat.title} className="faq-category-section">
            <div className="faq-cat-header">
              <div className="faq-cat-icon"><Icon name={cat.icon} /></div>
              <span>{cat.title}</span>
            </div>
            <div className="faq-list">
              {cat.items.map(item => {
                const key = `${cat.title}::${item.question}`;
                return (
                  <FAQItem
                    key={key}
                    item={item}
                    isOpen={!!openItems[key]}
                    onToggle={() => toggle(key)}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>

    </div>
  );
}
