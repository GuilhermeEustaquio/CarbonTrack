# CarbonTrack — EcoOrbit Solutions

Front-end em **Vite + React + TypeScript + Tailwind/CSS** para a Global Solution 2026/1. O CarbonTrack é uma plataforma digital para monitorar, calcular e analisar emissões de CO₂ geradas por empresas, especialmente no setor logístico e de transporte.

A solução mantém a narrativa de economia espacial aplicada a um problema real da Terra: emissões logísticas. O uso de mapas, coordenadas e dados georreferenciados permite visualizar rotas, origem, destino, distância, região e impactos ambientais por viagem.

## Escopo final

- Cadastrar empresas.
- Cadastrar caminhões vinculados a empresas.
- Cadastrar motoristas vinculados a empresas.
- Usar combustíveis predefinidos com fator de emissão de carbono.
- Cadastrar rotas logísticas com nome, origem, destino, distância, região e coordenadas.
- Registrar viagens com caminhão, motorista, rota e combustível.
- Gerar emissões automaticamente a partir das viagens.
- Gerar alertas ambientais automaticamente por regras de impacto.
- Exibir dashboard, relatórios, ranking ambiental e tendência simulada.
- Preparar o front para consumir backend Java/Spring Boot com Oracle SQL.
- Manter modo mock/localStorage funcional enquanto a API não estiver pronta.

## Fluxo correto da arquitetura

```text
React/Vite → API Java/Spring Boot → Oracle SQL
```

O front-end **não conecta diretamente ao Oracle**. A integração real deve ocorrer por `VITE_API_BASE_URL`, apontando para a API Java. `VITE_FORCE_MOCK=true` força o uso local para demonstração.

## Classes respeitadas no front

Os tipos do front preservam IDs como `string` para compatibilidade visual/mock/localStorage, mas os adapters aceitam `Long/number` vindos da API e normalizam internamente.

Entidades principais:

- `Empresa`: `id`, `nome`, `cnpj`, `setor`, `cidade`, `estado`, `responsavel`, `dataCadastro`.
- `Caminhao`: `id`, `placa`, `modelo`, `anoFabricacao`, `capacidadeCarga`, `empresaId`.
- `Motorista`: `id`, `nome`, `cpf`, `numeroCnh`, `validadeCnh`, `empresaId`.
- `Combustivel`: `id`, `nome`, `fatorEmissaoCarbono`.
- `Rota`: `id`, `nome`, `origem`, `destino`, `distanciaKm`, `regiao`, `origemLat`, `origemLon`, `destinoLat`, `destinoLon`.
- `Viagem`: `id`, `dataViagem`, `cargaTransportadaKg`, `distanciaPercorridaKm`, `caminhaoId`, `motoristaId`, `rotaId`, `combustivelId`.
- `Emissao`: `id`, `viagemId`, `consumoEstimadoLitros`, `co2EmitidoKg`, `indiceImpactoAmbiental`, `dataCalculo`.
- `AlertaAmbiental`: `id`, `tipo`, `descricao`, `nivel`, `dataGeracao`, `empresaId`.

Campos visuais como `ativo`, `sigla`, `cor`, `empresa`, `placa`, `motorista`, `rota` e `status` são front-only e não devem ser obrigatórios no backend.

## Combustíveis seed no modo mock

Sem API e com localStorage limpo, o CarbonTrack carrega combustíveis predefinidos para não deixar o select de Viagem vazio:

| Combustível | Fator de emissão de carbono |
| --- | ---: |
| Diesel S10 | 2.68 |
| Diesel S500 | 2.68 |
| Gasolina C | 2.31 |
| Etanol hidratado | 1.51 |
| GNV | 2.00 |

Com API ativa, o front espera `GET /combustiveis`. Se a API falhar, usa cache/localStorage e os seeds locais.

## Emissões e alertas automáticos

Emissões não são cadastro manual no front. A tela de Emissões é somente leitura e mostra `viagemId`, consumo estimado, CO₂ emitido, índice de impacto e data de cálculo, enriquecidos com dados da viagem quando disponíveis.

No modo mock/localStorage, ao criar uma viagem:

```text
consumoEstimadoLitros = distanciaPercorridaKm / 3
co2EmitidoKg = consumoEstimadoLitros * fatorEmissaoCarbono
baixo: até 100 kg CO₂
medio: acima de 100 até 300 kg CO₂
alto: acima de 300 kg CO₂
```

Alertas também são somente leitura/campos visuais. Impacto `medio` gera alerta de atenção; impacto `alto` gera alerta crítico. Com API real, emissões e alertas devem vir de `GET /emissoes` e `GET /alertas`.

## Rotas e página Sobre / Solução

A página **Sobre** funciona como a página **Sobre / Solução**. Ela explica problema, solução, startup EcoOrbit Solutions, produto CarbonTrack, logística/transporte, economia espacial, mapas/georreferenciamento, cálculo automático, alertas automáticos, preparação para API Java e ODS relacionados.

A entidade Rota agora possui oficialmente `nome` e coordenadas. O mapa do formulário grava apenas `origemLat`, `origemLon`, `destinoLat` e `destinoLon`, sem sobrescrever os textos humanos de origem e destino. O select de rotas em Viagem exibe `nome — km` e usa origem/destino apenas como fallback.

## Rotas principais do front

- `/`
- `/dashboard`
- `/empresas`
- `/caminhoes`
- `/motoristas`
- `/rotas`
- `/viagens`
- `/emissoes`
- `/alertas`
- `/relatorios`
- `/sobre`
- `/integrantes`
- `/faq`
- `/contato`

Não há módulo principal de ações de mitigação no escopo final, pois `AcaoMitigacao` não existe nas classes Java informadas.

## Endpoints esperados da API Java

```text
GET    /empresas
POST   /empresas
PUT    /empresas/:id
DELETE /empresas/:id

GET    /caminhoes
POST   /caminhoes
PUT    /caminhoes/:id
DELETE /caminhoes/:id

GET    /motoristas
POST   /motoristas
PUT    /motoristas/:id
DELETE /motoristas/:id

GET    /combustiveis

GET    /rotas
POST   /rotas
PUT    /rotas/:id
DELETE /rotas/:id

GET    /viagens
POST   /viagens
PUT    /viagens/:id
DELETE /viagens/:id

GET    /emissoes
GET    /alertas
GET    /relatorios
GET    /dashboard
```

Ao enviar dados para API real, IDs relacionais (`empresaId`, `caminhaoId`, `motoristaId`, `rotaId`, `combustivelId`, `viagemId`) devem ser convertidos para `number` quando possível. Payloads POST/PUT devem conter apenas campos compatíveis com as classes Java.

## Variáveis de ambiente

Crie `.env.local` quando necessário:

```bash
VITE_API_BASE_URL=http://localhost:8080
VITE_FORCE_MOCK=false
```

Para forçar o modo local:

```bash
VITE_FORCE_MOCK=true
```

## Modo mock/localStorage

Coleções locais esperadas:

- `ct:empresas`
- `ct:caminhoes`
- `ct:motoristas`
- `ct:combustiveis`
- `ct:rotas`
- `ct:viagens`
- `ct:emissoes`
- `ct:alertas`

O modo local preserva dados ao recarregar a página e permite demonstração sem backend rodando. Se a API estiver configurada mas indisponível, as telas usam cache/localStorage para evitar tela branca.

## Como executar

```bash
npm install
npm run dev
npm run build
```

Se houver script de lint disponível:

```bash
npm run lint
```

## Funcionalidades implementadas

- Dashboard com empresas, frota, motoristas, viagens, CO₂ total e alertas ativos.
- CRUD de empresas, caminhões, motoristas, rotas e viagens.
- Modelo de caminhão como texto livre.
- Número da CNH como documento numérico, não categoria.
- Rotas com nome, origem/destino textuais e coordenadas preservadas no create/update.
- Select de viagens exibindo nome da rota e distância.
- Combustíveis base/seed no modo mock.
- Emissões automáticas e somente leitura.
- Alertas ambientais automáticos e somente leitura.
- Relatórios por empresa, rota, combustível e tendência simulada até integração com modelo de IA.
