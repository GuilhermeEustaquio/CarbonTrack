export interface Motorista {
  id: string;
  nome: string;
  cpf: string;
  numeroCnh: string;
  validadeCnh: string;
  empresaId: string;
  empresa: string;
  ativo?: boolean;
}
