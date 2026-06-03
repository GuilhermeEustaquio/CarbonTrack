export interface Rota {
  id: string;
  nome: string;
  origem: string;
  destino: string;
  distanciaKm: number;
  regiao: string;
  origemLat?: number;
  origemLon?: number;
  destinoLat?: number;
  destinoLon?: number;
  ativo?: boolean;
}
