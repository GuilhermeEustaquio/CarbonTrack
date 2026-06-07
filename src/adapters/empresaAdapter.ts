import { normalizeAtivo } from '../utils/validators';
import { buildSigla, buildTrend, statusMeta, CORES_EMPRESA } from '../lib/constants';
import type { Empresa } from '../types/empresa';

type Raw = Record<string, unknown>;

export function toEmpresa(raw: Raw): Empresa {
  const emissaoMes = Number(raw.emissaoMes ?? raw.EMISSAO_MES ?? raw.emissao_mes ?? 0);
  // O backend Java envia "metaConsumo"; mantemos metaMensal/meta_mensal como fallback
  // para dados antigos de mock/localStorage. Internamente o front usa "metaMensal".
  const metaMensal = Number(raw.metaConsumo ?? raw.META_CONSUMO ?? raw.meta_consumo ?? raw.metaMensal ?? raw.META_MENSAL ?? raw.meta_mensal ?? 0);
  const nome = String(raw.nome ?? raw.NOME ?? '');
  const id = String(raw.id ?? raw.ID ?? raw.idEmpresa ?? raw.id_empresa ?? raw.ID_EMPRESA ?? raw.codigo ?? '');
  return {
    id,
    nome,
    cnpj: String(raw.cnpj ?? raw.CNPJ ?? ''),
    setor: String(raw.setor ?? raw.SETOR ?? ''),
    cidade: String(raw.cidade ?? raw.CIDADE ?? ''),
    estado: String(raw.estado ?? raw.ESTADO ?? raw.uf ?? raw.UF ?? 'SP').toUpperCase().slice(0, 2),
    responsavel: String(raw.responsavel ?? raw.RESPONSAVEL ?? ''),
    dataCadastro: String(raw.dataCadastro ?? raw.DATA_CADASTRO ?? raw.data_cadastro ?? new Date().toISOString().slice(0, 10)),
    sigla: String(raw.sigla ?? raw.SIGLA ?? '') || buildSigla(nome),
    cor: String(raw.cor ?? raw.COR ?? CORES_EMPRESA[Math.abs((id.charCodeAt(id.length - 1) || 0)) % CORES_EMPRESA.length]),
    metaMensal,
    emissaoMes,
    status: statusMeta(emissaoMes, metaMensal || 1),
    unidades: Number(raw.unidades ?? 0),
    tendencia: Array.isArray(raw.tendencia) ? (raw.tendencia as number[]) : buildTrend(emissaoMes),
    ativo: normalizeAtivo(raw.ativo ?? true),
  };
}
