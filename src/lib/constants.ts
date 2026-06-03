// Constantes e funções puras — sem dados de exemplo

export const SETORES = ['Todos', 'Logística', 'Indústria', 'Agronegócio', 'Energia', 'Mineração', 'Alimentos', 'Construção'];
export const TIPOS_OP = ['Fábrica', 'Escritório', 'Fazenda', 'Centro logístico', 'Área de preservação', 'Mina'];
export const UFS = ['SP', 'PE', 'SC', 'AM', 'ES', 'BA', 'RS', 'MG', 'RJ', 'PR', 'GO', 'MT', 'PA'];
export const REGIOES = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'];
export const MODELOS_CAMINHAO = ['Volvo FH 540', 'Scania R 450', 'Mercedes Actros', 'DAF XF 480', 'Iveco S-Way', 'Ford Cargo 2429'];

export const CORES_EMPRESA = [
  '#3FB8C4', '#6FB36B', '#C97A4A', '#5B8DD9',
  '#A98BD0', '#D98A8A', '#C4A24A', '#8C95A0',
];

/** Gera próximo código sequencial: 'EMP-001', 'CAM-003', etc. */
export function nextCode(items: { id: string }[], prefix: string, pad = 3): string {
  const max = items.reduce((acc, item) => {
    const n = Number(String(item.id).replace(prefix, ''));
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return `${prefix}${String(max + 1).padStart(pad, '0')}`;
}

export function buildSigla(nome: string): string {
  return nome.split(/\s+/).filter(Boolean).slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '').join('').slice(0, 2) || 'CT';
}

export function buildTrend(value: number): number[] {
  const base = Number(value) || 0;
  return [0.78, 0.82, 0.88, 0.93, 0.97, 1].map(r => Number((base * r).toFixed(1)));
}

export function normalizeCnpj(value: string): string {
  return value.replace(/\D/g, '');
}

export const CONSUMO_MEDIO_ESTIMADO_KM_POR_LITRO = 3;

/**
 * Calcula CO₂ no modo mock/localStorage. A classe Viagem não possui consumo real;
 * por isso o protótipo estima litros como distância ÷ média fixa de 3 km/L.
 */
export function calcCo2Viagem(
  distanciaKm: number,
  fatorEmissaoCarbono: number,
  _cargaKg = 0,
): { co2Kg: number; consumoLitros: number } {
  const distancia = Number.isFinite(Number(distanciaKm)) ? Math.max(Number(distanciaKm), 0) : 0;
  const fator = Number.isFinite(Number(fatorEmissaoCarbono)) ? Number(fatorEmissaoCarbono) : 0;
  const consumoLitros = Number((distancia / CONSUMO_MEDIO_ESTIMADO_KM_POR_LITRO).toFixed(2));
  const co2Kg = Number((consumoLitros * fator).toFixed(2));
  return { co2Kg, consumoLitros };
}

export function nivelImpacto(co2Kg: number): 'baixo' | 'medio' | 'alto' {
  if (co2Kg <= 100) return 'baixo';
  if (co2Kg <= 300) return 'medio';
  return 'alto';
}

export function statusMeta(emissao: number, meta: number): 'dentro' | 'atencao' | 'critico' {
  const p = (emissao / (meta || 1)) * 100;
  if (p <= 70) return 'dentro';
  if (p <= 100) return 'atencao';
  return 'critico';
}

export function fmt(n: number, dec = 0): string {
  return Number(n).toLocaleString('pt-BR', {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
}

/** Últimos N meses como abreviações ('Jan', 'Fev', ...) */
export function ultimos6Meses(): string[] {
  const ABBR = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return ABBR[d.getMonth()];
  });
}

/** Retorna abreviação do mês a partir de uma data ISO ('2026-06-01' → 'Jun') */
export function mesAbrev(iso: string): string {
  const ABBR = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const m = parseInt(iso?.slice(5, 7) ?? '0', 10);
  return ABBR[m - 1] ?? '';
}
