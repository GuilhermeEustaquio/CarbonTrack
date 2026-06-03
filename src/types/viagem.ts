export type StatusViagem = 'planejada' | 'em andamento' | 'concluída' | 'cancelada';

export interface Viagem {
  id: string;
  dataViagem: string;
  cargaTransportadaKg: number;
  distanciaPercorridaKm: number;
  caminhaoId: string;
  motoristaId: string;
  rotaId: string;
  combustivelId: string;
  // Campos denormalizados para exibição
  placa?: string;
  motorista?: string;
  rota?: string;
  empresa?: string;
  empresaId?: string;
  status?: StatusViagem;
}
