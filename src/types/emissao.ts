// Emissao é calculada pelo backend a partir de uma Viagem — somente leitura no front
export interface Emissao {
  id: string;
  viagemId: string;
  consumoEstimadoLitros: number;
  co2EmitidoKg: number;
  indiceImpactoAmbiental: string;
  dataCalculo: string;
}

export type StatusAcao = 'planejada' | 'em andamento' | 'concluída';

export interface AcaoMitigacao {
  id: string;
  empresaId: string;
  unidadeId: string;
  tipo: string;
  descricao: string;
  impactoEstimado: number;
  status: StatusAcao;
  inicio: string;
  prazo: string;
}
