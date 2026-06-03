import type { Alerta } from '../types/alerta';
import type { Caminhao } from '../types/caminhao';
import type { Combustivel } from '../types/combustivel';
import type { Emissao } from '../types/emissao';
import type { Empresa } from '../types/empresa';
import type { Motorista } from '../types/motorista';
import type { Rota } from '../types/rota';
import type { StatusMeta } from '../types/common';
import type { Viagem } from '../types/viagem';
import type { Database } from './storage';

export type EmpresaVisualStats = {
  empresa: Empresa;
  caminhoes: number;
  motoristas: number;
  viagens: number;
  alertas: number;
  co2Kg: number;
  co2T: number;
  metaMensalT: number;
  pctMeta: number | null;
  status: StatusMeta;
  ranking: number;
};

export type DashboardMetrics = {
  empresasAtivas: number;
  caminhoesAtivos: number;
  motoristasAtivos: number;
  rotasAtivas: number;
  viagensRegistradas: number;
  emissoesRegistradas: number;
  co2TotalKg: number;
  alertasAtivos: number;
  rankingAmbiental: EmpresaVisualStats[];
};

export function getEmpresaById(db: Database, empresaId?: string): Empresa | undefined {
  return db.empresas.find(e => e.id === empresaId);
}

export function getCaminhaoById(db: Database, caminhaoId?: string): Caminhao | undefined {
  return db.caminhoes.find(c => c.id === caminhaoId);
}

export function getMotoristaById(db: Database, motoristaId?: string): Motorista | undefined {
  return db.motoristas.find(m => m.id === motoristaId);
}

export function getRotaById(db: Database, rotaId?: string): Rota | undefined {
  return db.rotas.find(r => r.id === rotaId);
}

export function getCombustivelById(db: Database, combustivelId?: string): Combustivel | undefined {
  return db.combustiveis.find(c => c.id === combustivelId);
}

export function getViagensAtivas(db: Database): Viagem[] {
  return db.viagens;
}

export function getEmissoesPorViagem(db: Database): Map<string, Emissao> {
  const viagensIds = new Set(db.viagens.map(v => v.id));
  const map = new Map<string, Emissao>();
  db.emissoes.forEach(emissao => {
    if (!emissao.viagemId || !viagensIds.has(emissao.viagemId) || map.has(emissao.viagemId)) return;
    map.set(emissao.viagemId, emissao);
  });
  return map;
}

export function getEmissoesAtivas(db: Database): Emissao[] {
  return [...getEmissoesPorViagem(db).values()];
}

export function getAlertasAtivos(db: Database): Alerta[] {
  return db.alertas.filter(a => !a.resolvido);
}

export function getViagensPorEmpresa(db: Database, empresaId: string): Viagem[] {
  return getViagensAtivas(db).filter(v => {
    if (v.empresaId === empresaId) return true;
    const caminhao = getCaminhaoById(db, v.caminhaoId);
    return caminhao?.empresaId === empresaId;
  });
}

export function getCaminhoesPorEmpresa(db: Database, empresaId: string): Caminhao[] {
  return db.caminhoes.filter(c => c.ativo !== false && c.empresaId === empresaId);
}

export function getMotoristasPorEmpresa(db: Database, empresaId: string): Motorista[] {
  return db.motoristas.filter(m => m.ativo !== false && m.empresaId === empresaId);
}

export function getAlertasPorEmpresa(db: Database, empresaId: string): Alerta[] {
  return getAlertasAtivos(db).filter(a => a.empresaId === empresaId);
}

export function getCo2Total(db: Database): number {
  return getEmissoesAtivas(db).reduce((total, emissao) => total + Number(emissao.co2EmitidoKg || 0), 0);
}

export function getCo2PorEmpresa(db: Database, empresaId: string): number {
  const emissoesPorViagem = getEmissoesPorViagem(db);
  return getViagensPorEmpresa(db, empresaId).reduce((total, viagem) => total + Number(emissoesPorViagem.get(viagem.id)?.co2EmitidoKg || 0), 0);
}

export function getEmissoesPorEmpresa(db: Database): Map<string, number> {
  const map = new Map<string, number>();
  db.empresas.forEach(empresa => map.set(empresa.id, getCo2PorEmpresa(db, empresa.id)));
  return map;
}

export function getCo2PorRota(db: Database): Array<{ id: string; nome: string; co2Kg: number }> {
  const emissoesPorViagem = getEmissoesPorViagem(db);
  const map = new Map<string, { id: string; nome: string; co2Kg: number }>();
  getViagensAtivas(db).forEach(viagem => {
    const emissao = emissoesPorViagem.get(viagem.id);
    if (!emissao) return;
    const rota = getRotaById(db, viagem.rotaId);
    const id = viagem.rotaId || 'sem-rota';
    const nome = rota?.nome || viagem.rota || (rota ? `${rota.origem} → ${rota.destino}` : 'Sem rota');
    const atual = map.get(id) ?? { id, nome, co2Kg: 0 };
    atual.co2Kg += Number(emissao.co2EmitidoKg || 0);
    map.set(id, atual);
  });
  return [...map.values()].sort((a, b) => b.co2Kg - a.co2Kg);
}

export function getCo2PorCombustivel(db: Database): Array<{ id: string; nome: string; co2Kg: number }> {
  const emissoesPorViagem = getEmissoesPorViagem(db);
  const map = new Map<string, { id: string; nome: string; co2Kg: number }>();
  getViagensAtivas(db).forEach(viagem => {
    const emissao = emissoesPorViagem.get(viagem.id);
    if (!emissao) return;
    const combustivel = getCombustivelById(db, viagem.combustivelId);
    const id = viagem.combustivelId || 'sem-combustivel';
    const nome = combustivel?.nome || viagem.combustivelId || 'Sem combustível';
    const atual = map.get(id) ?? { id, nome, co2Kg: 0 };
    atual.co2Kg += Number(emissao.co2EmitidoKg || 0);
    map.set(id, atual);
  });
  return [...map.values()].sort((a, b) => b.co2Kg - a.co2Kg);
}

export function getStatusEmpresa(db: Database, empresaId: string): StatusMeta {
  const empresa = getEmpresaById(db, empresaId);
  const co2Kg = getCo2PorEmpresa(db, empresaId);
  const metaMensalT = Number(empresa?.metaMensal || 0);
  if (metaMensalT > 0) {
    const metaKg = metaMensalT * 1000;
    if (co2Kg <= metaKg * 0.9) return 'dentro';
    if (co2Kg <= metaKg) return 'atencao';
    return 'critico';
  }
  if (co2Kg <= 500) return 'dentro';
  if (co2Kg <= 1500) return 'atencao';
  return 'critico';
}

export function getEmpresaVisualStats(db: Database, empresaId: string): EmpresaVisualStats {
  const empresa = getEmpresaById(db, empresaId) ?? db.empresas[0];
  const co2Kg = getCo2PorEmpresa(db, empresaId);
  const metaMensalT = Number(empresa?.metaMensal || 0);
  const ranking = getRankingAmbiental(db).findIndex(item => item.empresa.id === empresaId) + 1;
  return {
    empresa,
    caminhoes: getCaminhoesPorEmpresa(db, empresaId).length,
    motoristas: getMotoristasPorEmpresa(db, empresaId).length,
    viagens: getViagensPorEmpresa(db, empresaId).length,
    alertas: getAlertasPorEmpresa(db, empresaId).length,
    co2Kg,
    co2T: co2Kg / 1000,
    metaMensalT,
    pctMeta: metaMensalT > 0 ? Math.round((co2Kg / (metaMensalT * 1000)) * 100) : null,
    status: getStatusEmpresa(db, empresaId),
    ranking: ranking || 0,
  };
}

export function getRankingAmbiental(db: Database): EmpresaVisualStats[] {
  return db.empresas
    .filter(e => e.ativo !== false)
    .map(empresa => {
      const co2Kg = getCo2PorEmpresa(db, empresa.id);
      const metaMensalT = Number(empresa.metaMensal || 0);
      return {
        empresa,
        caminhoes: getCaminhoesPorEmpresa(db, empresa.id).length,
        motoristas: getMotoristasPorEmpresa(db, empresa.id).length,
        viagens: getViagensPorEmpresa(db, empresa.id).length,
        alertas: getAlertasPorEmpresa(db, empresa.id).length,
        co2Kg,
        co2T: co2Kg / 1000,
        metaMensalT,
        pctMeta: metaMensalT > 0 ? Math.round((co2Kg / (metaMensalT * 1000)) * 100) : null,
        status: getStatusEmpresa(db, empresa.id),
        ranking: 0,
      };
    })
    .sort((a, b) => b.co2Kg - a.co2Kg)
    .map((item, index) => ({ ...item, ranking: index + 1 }));
}

export function getDashboardMetrics(db: Database): DashboardMetrics {
  const rankingAmbiental = getRankingAmbiental(db);
  return {
    empresasAtivas: db.empresas.filter(e => e.ativo !== false).length,
    caminhoesAtivos: db.caminhoes.filter(c => c.ativo !== false).length,
    motoristasAtivos: db.motoristas.filter(m => m.ativo !== false).length,
    rotasAtivas: db.rotas.filter(r => r.ativo !== false).length,
    viagensRegistradas: getViagensAtivas(db).length,
    emissoesRegistradas: getEmissoesAtivas(db).length,
    co2TotalKg: getCo2Total(db),
    alertasAtivos: getAlertasAtivos(db).length,
    rankingAmbiental,
  };
}

export function getCo2MensalUltimos6(db: Database): { labels: string[]; dataTon: number[] } {
  const ABBR = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const now = new Date();
  const meses = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return { key, label: ABBR[d.getMonth()] };
  });
  const emissoes = getEmissoesAtivas(db);
  return {
    labels: meses.map(m => m.label),
    dataTon: meses.map(m => Number((emissoes.filter(e => e.dataCalculo?.startsWith(m.key)).reduce((sum, e) => sum + Number(e.co2EmitidoKg || 0), 0) / 1000).toFixed(3))),
  };
}
