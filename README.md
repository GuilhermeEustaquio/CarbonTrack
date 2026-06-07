<div align="center">
  <img src="public/favicon.svg" alt="Logo CarbonTrack" width="120"/>

  # CarbonTrack — Front-End

  **Plataforma digital para monitorar, calcular e analisar emissões de CO₂ na logística e no transporte**

  [![GitHub repo](https://img.shields.io/badge/Repositório-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/guilhermeeustaquio/CarbonTrack)
  [![Vercel](https://img.shields.io/badge/Deploy_Front-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://carbon-track-seven.vercel.app/)
  [![Render](https://img.shields.io/badge/API_Java-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://globalsolution2-java.onrender.com)
</div>

## 📋 Sobre o Projeto

### ❓ Problema

Empresas de **logística e transporte** geram emissões de CO₂ diariamente, mas raramente possuem uma **visão integrada** de frota, motoristas, rotas, viagens, combustível consumido e impacto ambiental. Com os dados dispersos em planilhas isoladas, fica difícil medir, comparar e reduzir as emissões.

### 💡 Nossa Solução

Desenvolvemos uma **SPA centralizada** que transforma registros operacionais de viagens em **indicadores ambientais**. A partir de empresas, caminhões, motoristas, rotas e combustíveis, o sistema calcula emissões de CO₂ automaticamente, gera alertas ambientais e organiza relatórios para apoiar decisões ESG.

A solução mantém a narrativa de **economia espacial** aplicada a um problema real da Terra: as emissões logísticas. O uso de mapas, coordenadas e dados georreferenciados permite visualizar rotas, origem, destino, distância, região e impactos ambientais por viagem.

### 🎯 Objetivo

Facilitar a **gestão de emissões e a análise ambiental** do transporte corporativo, oferecendo dashboard, ranking ESG, cálculo automático de CO₂ e relatórios — tudo preparado para consumir uma API Java/Spring Boot integrada ao Oracle SQL.

---

## 🛰️ Conexão com a Global Solution

O CarbonTrack se conecta à **Global Solution 2026/1** ao aplicar georreferenciamento, mapas e análise ambiental ao enfrentamento das emissões de CO₂ no transporte. A arquitetura está preparada para integração real com backend Java, mantendo um modo mock/localStorage funcional para demonstração sem servidor ativo.

---
## ⚡ Tecnologias Utilizadas

| Tecnologia | Descrição |
|---|---|
| **React** | Biblioteca para construção de interfaces (SPA) |
| **Vite** | Bundler e servidor de desenvolvimento rápido |
| **TypeScript** | Superset tipado do JavaScript |
| **TailwindCSS** | Base de estilização via classes utilitárias |
| **React Router DOM** | Roteamento entre páginas (rotas estáticas e dinâmicas) |
| **Leaflet + OpenStreetMap/CARTO** | Mapas e rotas georreferenciadas (sem chave obrigatória) |
| **Fetch API** | Comunicação com a API REST (nativa, sem Axios) |
| **Java / Spring Boot** | Backend previsto para integração via REST |
| **Oracle SQL** | Banco de dados relacional previsto |
| **Git & GitHub** | Versionamento e hospedagem do código |
| **Vercel / Render** | Deploy do front-end e da API |

---
## 🏗️ Arquitetura

```text
React/Vite → API Java/Spring Boot → Oracle SQL
```

O front-end **não conecta diretamente ao Oracle**. A integração real ocorre via `VITE_API_BASE_URL`, apontando para a API Java. Quando a API não está configurada ou indisponível, o sistema usa **mock/localStorage** para manter a demonstração funcional, e `VITE_FORCE_MOCK=true` força o modo local mesmo com a URL configurada.

Os dados são normalizados por **adapters** (aceitam IDs `Long`/`number` da API e diferentes convenções de nomes), e os **payloads** enviados respeitam as classes Java, sem mandar campos visuais que existem apenas no front.

---
# 📁 Estrutura de Pastas

```text
CarbonTrack/
├── public/
│   └── favicon.svg
├── src/
│   ├── adapters/                  # Normalização dos dados vindos da API Java
│   ├── components/
│   │   ├── charts/                # Sparkline, AreaChart, Donut, Gauge, BarList (SVG puro)
│   │   ├── icons/                 # Icon.tsx + biblioteca de paths SVG
│   │   ├── maps/                  # RotaMap e RoutePickerMap (Leaflet)
│   │   └── ui/                    # Button, Badge, Modal, Card, Toasts, etc.
│   ├── context/
│   │   └── DataContext.tsx        # Estado global, CRUD e sincronização com a API
│   ├── hooks/                     # useData, useTheme, useToasts, etc.
│   ├── layouts/
│   │   └── AppLayout.tsx          # Sidebar, topbar e layout geral
│   ├── lib/                       # constants, selectors, storage, tombstones, javaPayload
│   ├── pages/                     # Home, Dashboard, Empresas, Caminhoes, ...
│   ├── routes/
│   │   └── AppRoutes.tsx          # Definição das rotas
│   ├── services/                  # api.ts + serviços por entidade
│   ├── styles/
│   │   └── index.css              # Design system (dark-first)
│   ├── types/                     # Tipos TypeScript globais
│   ├── utils/                     # masks, validators, formatters
│   ├── App.tsx                    # Componente raiz
│   └── main.tsx                   # Ponto de entrada
├── .env.example                   # Variáveis de ambiente de exemplo
├── index.html
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── vercel.json
└── vite.config.ts
```

---
## 🧩 Funcionalidades

- Dashboard ESG com empresas, frota, motoristas, viagens, CO₂ total e alertas ativos.
- CRUD de empresas, caminhões, motoristas, rotas e viagens.
- Rotas com nome, origem/destino textuais e coordenadas selecionadas no mapa.
- Cálculo automático de **consumo estimado** e **CO₂ emitido** por viagem.
- Emissões e alertas ambientais **somente leitura**, gerados a partir das viagens.
- Relatórios por empresa, rota, combustível e período, com exportação em CSV.
- Mapa de rotas georreferenciado (OpenStreetMap/CARTO) com tema claro/escuro.
- Modo mock/localStorage para demonstração sem backend ativo.

> No modo local, `consumoEstimadoLitros = distanciaPercorridaKm / 3` e
> `co2EmitidoKg = consumoEstimadoLitros × fator de emissão do combustível`.
> No modo API, esse cálculo é responsabilidade do backend Java.

---
## 🚀 Como Usar

### Links Importantes

| Recurso | Link |
|---|---|
| 📁 Repositório GitHub | [github.com/guilhermeeustaquio/CarbonTrack](https://github.com/guilhermeeustaquio/CarbonTrack) |
| 🌐 Deploy Front (Vercel) | [INSERIR LINK DO DEPLOY] |
| ⚙️ API Java (Render) | [globalsolution2-java.onrender.com](https://globalsolution2-java.onrender.com) |
| 🎬 Vídeo de Demonstração | [INSERIR LINK DO VÍDEO] |

### Rodando Localmente

**1. Clone o repositório**
```bash
git clone https://github.com/guilhermeeustaquio/CarbonTrack.git
```

**2. Acesse a pasta do projeto**
```bash
cd CarbonTrack
```

**3. Instale as dependências**
```bash
npm install
```

**4. Configure as variáveis de ambiente** *(opcional — sem isso, usa dados mockados)*
```bash
cp .env.example .env
# Edite o .env e defina VITE_API_BASE_URL com a URL do backend Java
# Exemplo: VITE_API_BASE_URL=https://globalsolution2-java.onrender.com
```

**5. Execute o projeto**
```bash
npm run dev
```

**6. Acesse no navegador**
```text
http://localhost:5173/
```

### Variáveis de Ambiente

| Variável | Descrição |
|---|---|
| `VITE_API_BASE_URL` | URL base da API Java/Spring Boot (sem barra no final). Vazia = modo mock. |
| `VITE_FORCE_MOCK` | `true` força o fallback local mesmo com a API configurada. |

### Outros Comandos

```bash
npm run build    # Gera o build de produção
npm run preview  # Visualiza o build localmente
npm run lint     # Executa o ESLint (se configurado)
```

---

## 👥 Autores

<table>
  <tr>
    <th>Foto</th>
    <th>Nome</th>
    <th>RM</th>
    <th>Turma</th>
    <th>GitHub</th>
    <th>LinkedIn</th>
  </tr>
  <tr>
    <td align="center">
      <img src="https://github.com/guilhermeeustaquio.png" alt="Guilherme Eustaquio" width="80" style="border-radius:50%"/>
    </td>
    <td><strong>Guilherme Eustaquio</strong></td>
    <td>566784</td>
    <td>1TDSPS</td>
    <td>
      <a href="https://github.com/guilhermeeustaquio">
        <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"/>
      </a>
    </td>
    <td>
      <a href="https://www.linkedin.com/in/guilhermeeustaquio">
        <img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn"/>
      </a>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="https://github.com/caioccouto.png" alt="Caio Cantini Couto" width="80" style="border-radius:50%"/>
    </td>
    <td><strong>Caio Cantini Couto</strong></td>
    <td>563452</td>
    <td>1TDSPS</td>
    <td>
      <a href="https://github.com/caioccouto">
        <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"/>
      </a>
    </td>
    <td>
      <a href="https://www.linkedin.com/in/caio-couto-44b849326">
        <img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn"/>
      </a>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="https://github.com/manovares.png" alt="Matheus Tavares" width="80" style="border-radius:50%"/>
    </td>
    <td><strong>Matheus Tavares</strong></td>
    <td>566844</td>
    <td>1TDSPS</td>
    <td>
      <a href="https://github.com/manovares">
        <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"/>
      </a>
    </td>
    <td>
      <a href="https://www.linkedin.com/in/manovares">
        <img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn"/>
      </a>
    </td>
  </tr>
</table>

---

## 📬 Contato

Entre em contato com a equipe pelos perfis do LinkedIn acima ou abra uma [issue no repositório](https://github.com/guilhermeeustaquio/CarbonTrack/issues).

---

## 📌 Observações

- Este repositório é destinado à avaliação acadêmica do projeto (FIAP — Global Solution 2026/1).
- O fluxo correto da arquitetura é **React/Vite → API Java/Spring Boot → Oracle SQL**; o front nunca acessa o Oracle diretamente.
- A área de gestão funciona com **dados mockados** quando `VITE_API_BASE_URL` não está configurada.
- Emissões e alertas são **somente leitura**: são derivados das viagens, não cadastrados manualmente.
- Não há autenticação nesta versão.

<div align="center">
  <sub>Desenvolvido pela equipe EcoOrbit Solutions — FIAP 1TDS</sub>
</div>
