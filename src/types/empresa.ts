import type { StatusMeta } from './common';

export interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
  setor: string;
  cidade: string;
  estado: string;
  responsavel: string;
  dataCadastro: string;
  // Campos enriquecidos no front-end
  sigla: string;
  cor: string;
  metaMensal: number;
  emissaoMes: number;
  status: StatusMeta;
  unidades: number;
  tendencia: number[];
  ativo?: boolean;
}
