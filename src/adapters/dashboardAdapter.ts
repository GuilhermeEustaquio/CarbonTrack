type Raw = Record<string, unknown>;

export interface DashboardSummary {
  emissaoMensalTotal: number;
  metaMensalTotal: number;
  totalEmpresas: number;
  totalAlertas: number;
  emissaoPorFonte: { nome: string; valor: number; cor: string }[];
}

export function toDashboard(raw: Raw): DashboardSummary {
  return {
    emissaoMensalTotal: Number(raw.emissaoMensalTotal ?? raw.EMISSAO_MENSAL_TOTAL ?? raw.emissao_mensal_total ?? 0),
    metaMensalTotal: Number(raw.metaMensalTotal ?? raw.META_MENSAL_TOTAL ?? raw.meta_mensal_total ?? 0),
    totalEmpresas: Number(raw.totalEmpresas ?? raw.TOTAL_EMPRESAS ?? raw.total_empresas ?? 0),
    totalAlertas: Number(raw.totalAlertas ?? raw.TOTAL_ALERTAS ?? raw.total_alertas ?? 0),
    emissaoPorFonte: Array.isArray(raw.emissaoPorFonte)
      ? (raw.emissaoPorFonte as Raw[]).map((f) => ({
          nome: String(f.nome ?? ''),
          valor: Number(f.valor ?? 0),
          cor: String(f.cor ?? '#3FB8C4'),
        }))
      : [],
  };
}
