const toNumberId = (value: unknown): number | unknown => {
  const n = Number(value);
  return Number.isFinite(n) ? n : value;
};

export function empresaPayload(input: Record<string, unknown>) {
  return {
    id: input.id ? toNumberId(input.id) : undefined,
    nome: input.nome,
    cnpj: input.cnpj,
    setor: input.setor,
    cidade: input.cidade,
    estado: input.estado,
    responsavel: input.responsavel,
    dataCadastro: input.dataCadastro,
  };
}

export function caminhaoPayload(input: Record<string, unknown>) {
  return {
    id: input.id ? toNumberId(input.id) : undefined,
    placa: input.placa,
    modelo: input.modelo,
    anoFabricacao: Number(input.anoFabricacao ?? 0),
    capacidadeCarga: Number(input.capacidadeCarga ?? 0),
    empresaId: toNumberId(input.empresaId),
  };
}

export function motoristaPayload(input: Record<string, unknown>) {
  return {
    id: input.id ? toNumberId(input.id) : undefined,
    nome: input.nome,
    cpf: input.cpf,
    numeroCnh: input.numeroCnh,
    validadeCnh: input.validadeCnh,
    empresaId: toNumberId(input.empresaId),
  };
}

export function rotaPayload(input: Record<string, unknown>) {
  return {
    id: input.id ? toNumberId(input.id) : undefined,
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
  return {
    id: input.id ? toNumberId(input.id) : undefined,
    dataViagem: input.dataViagem,
    cargaTransportadaKg: Number(input.cargaTransportadaKg ?? 0),
    distanciaPercorridaKm: Number(input.distanciaPercorridaKm ?? 0),
    caminhaoId: toNumberId(input.caminhaoId),
    motoristaId: toNumberId(input.motoristaId),
    rotaId: toNumberId(input.rotaId),
    combustivelId: toNumberId(input.combustivelId),
  };
}
