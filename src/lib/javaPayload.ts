// Inclui o ID no payload apenas se for numérico válido (IDs locais como "EMP-001" são omitidos).
const numId = (value: unknown): number | undefined => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

const digitsOnly = (value: unknown) => String(value ?? '').replace(/\D/g, '');

export function empresaPayload(input: Record<string, unknown>) {
  const id = numId(input.id);
  return {
    ...(id !== undefined ? { id } : {}),
    nome: input.nome,
    cnpj: digitsOnly(input.cnpj),
    setor: input.setor,
    cidade: input.cidade,
    uf: input.estado,
    responsavel: input.responsavel,
    // dataCadastro omitido — gerenciado pelo servidor
  };
}

export function caminhaoPayload(input: Record<string, unknown>) {
  const id = numId(input.id);
  const empresaId = numId(input.empresaId);
  return {
    ...(id !== undefined ? { id } : {}),
    placa: input.placa,
    modelo: input.modelo,
    anoFabricacao: Number(input.anoFabricacao ?? 0),
    capacidadeCarga: Number(input.capacidadeCarga ?? 0),
    ...(empresaId !== undefined ? { empresaId } : {}),
  };
}

export function motoristaPayload(input: Record<string, unknown>) {
  const id = numId(input.id);
  const empresaId = numId(input.empresaId);
  return {
    ...(id !== undefined ? { id } : {}),
    nome: input.nome,
    cpf: digitsOnly(input.cpf),
    numeroCnh: input.numeroCnh,
    validadeCnh: input.validadeCnh,
    ...(empresaId !== undefined ? { empresaId } : {}),
  };
}

export function rotaPayload(input: Record<string, unknown>) {
  const id = numId(input.id);
  return {
    ...(id !== undefined ? { id } : {}),
    nome: input.nome,
    origem: input.origem,
    destino: input.destino,
    distanciaKm: Number(input.distanciaKm ?? 0),
    regiao: input.regiao,
    origemLat: input.origemLat === undefined ? undefined : Number(input.origemLat),
    origemLon: input.origemLon === undefined ? undefined : Number(input.origemLon),
    destinoLat: input.destinoLat === undefined ? undefined : Number(input.destinoLat),
    destinoLon: input.destinoLon === undefined ? undefined : Number(input.destinoLon),
  };
}

export function viagemPayload(input: Record<string, unknown>) {
  const id = numId(input.id);
  const caminhaoId = numId(input.caminhaoId);
  const motoristaId = numId(input.motoristaId);
  const rotaId = numId(input.rotaId);
  const combustivelId = numId(input.combustivelId);
  return {
    ...(id !== undefined ? { id } : {}),
    dtViagem: input.dataViagem,
    cargaTransportadaKg: Number(input.cargaTransportadaKg ?? 0),
    distanciaPercorridaKm: Number(input.distanciaPercorridaKm ?? 0),
    ...(caminhaoId !== undefined ? { caminhaoId } : {}),
    ...(motoristaId !== undefined ? { motoristaId } : {}),
    ...(rotaId !== undefined ? { rotaId } : {}),
    ...(combustivelId !== undefined ? { combustivelId } : {}),
  };
}
