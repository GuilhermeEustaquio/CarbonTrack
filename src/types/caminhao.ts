export interface Caminhao {
  id: string;
  placa: string;
  modelo: string;
  anoFabricacao: number;
  capacidadeCarga: number;
  empresaId: string;
  empresa: string;
  ativo?: boolean;
}
