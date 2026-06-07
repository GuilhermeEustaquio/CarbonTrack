import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { isApiEnabled, API_BASE_URL, apiRequest, isDependencyError } from '../services/api';
import { criarEmpresa as svcCriarEmpresa, atualizarEmpresa as svcAtualizarEmpresa, removerEmpresa as svcRemoverEmpresa } from '../services/empresasService';
import { criarCaminhao as svcCriarCaminhao, atualizarCaminhao as svcAtualizarCaminhao, removerCaminhao as svcRemoverCaminhao } from '../services/caminhaoService';
import { criarMotorista as svcCriarMotorista, atualizarMotorista as svcAtualizarMotorista, removerMotorista as svcRemoverMotorista } from '../services/motoristaService';
import { criarRota as svcCriarRota, atualizarRota as svcAtualizarRota, removerRota as svcRemoverRota } from '../services/rotaService';
import { criarViagem as svcCriarViagem, atualizarViagem as svcAtualizarViagem, removerViagem as svcRemoverViagem } from '../services/viagemService';
import type { Alerta } from '../types/alerta';
import type { AcaoMitigacao, Emissao } from '../types/emissao';
import type { Empresa } from '../types/empresa';
import type { Unidade } from '../types/unidade';
import type { Caminhao } from '../types/caminhao';
import type { Motorista } from '../types/motorista';
import type { Rota } from '../types/rota';
import type { Viagem } from '../types/viagem';
import type { Combustivel } from '../types/combustivel';
import { toEmpresa } from '../adapters/empresaAdapter';
import { toCaminhao } from '../adapters/caminhaoAdapter';
import { toMotorista } from '../adapters/motoristaAdapter';
import { toRota } from '../adapters/rotaAdapter';
import { toViagem } from '../adapters/viagemAdapter';
import { toEmissao } from '../adapters/emissaoAdapter';
import { toAlerta } from '../adapters/alertaAdapter';
import { toCombustivel } from '../adapters/combustivelAdapter';
import {
  loadAllStorage, writeAllStorage, writeStorage, readStorage, clearStorage,
  type Database,
} from '../lib/storage';
import { addTombstones, applyTombstones, clearTombstones } from '../lib/tombstones';
import {
  buildSigla, buildTrend, statusMeta, normalizeCnpj, nextCode,
  calcCo2Viagem, nivelImpacto, CORES_EMPRESA,
} from '../lib/constants';
import { isCnpjLengthValid } from '../utils/validators';

export type DataMode = 'mock' | 'api';
type Result<T> = { ok: true; data: T; message?: string } | { ok: false; error: string };
type VoidResult = { ok: true; message?: string } | { ok: false; error: string };
export type VinculoTipo = 'empresa' | 'caminhao' | 'motorista' | 'rota' | 'viagem';

type EmpresaInput = Partial<Empresa> & Pick<Empresa, 'nome' | 'cnpj' | 'setor' | 'cidade' | 'estado'>;
type UnidadeInput = Partial<Unidade> & Pick<Unidade, 'nome' | 'empresaId' | 'tipo' | 'risco' | 'uf'>;
type AcaoInput = Partial<AcaoMitigacao> & Pick<AcaoMitigacao, 'empresaId' | 'tipo' | 'status'>;
type CaminhaoInput = Partial<Caminhao> & Pick<Caminhao, 'placa' | 'modelo' | 'empresaId'>;
type MotoristaInput = Partial<Motorista> & Pick<Motorista, 'nome' | 'cpf' | 'empresaId'>;
type RotaInput = Partial<Rota> & Pick<Rota, 'nome' | 'origem' | 'destino' | 'distanciaKm'>;
type ViagemInput = Partial<Viagem> & Pick<Viagem, 'caminhaoId' | 'motoristaId' | 'rotaId' | 'combustivelId' | 'distanciaPercorridaKm' | 'dataViagem'>;

interface DataContextValue extends Database {
  loading: boolean;
  mode: DataMode;
  modeLabel: string;
  lastUpdatedAt: string;
  allEmpresas: Empresa[];
  // Empresa CRUD
  createEmpresa: (input: EmpresaInput) => Result<Empresa>;
  updateEmpresa: (id: string, input: EmpresaInput) => Result<Empresa>;
  deleteEmpresa: (id: string) => Promise<VoidResult>;
  // Unidade CRUD
  createUnidade: (input: UnidadeInput) => Result<Unidade>;
  updateUnidade: (id: string, input: UnidadeInput) => Result<Unidade>;
  deleteUnidade: (id: string) => VoidResult;
  // Caminhão CRUD
  createCaminhao: (input: CaminhaoInput) => Result<Caminhao>;
  updateCaminhao: (id: string, input: CaminhaoInput) => Result<Caminhao>;
  deleteCaminhao: (id: string) => Promise<VoidResult>;
  // Motorista CRUD
  createMotorista: (input: MotoristaInput) => Result<Motorista>;
  updateMotorista: (id: string, input: MotoristaInput) => Result<Motorista>;
  deleteMotorista: (id: string) => Promise<VoidResult>;
  // Rota CRUD
  createRota: (input: RotaInput) => Result<Rota>;
  updateRota: (id: string, input: RotaInput) => Result<Rota>;
  deleteRota: (id: string) => Promise<VoidResult>;
  // Viagem CRUD
  createViagem: (input: ViagemInput) => Result<Viagem>;
  updateViagem: (id: string, input: ViagemInput) => Result<Viagem>;
  deleteViagem: (id: string) => Promise<VoidResult>;
  // Vínculos (para avisar antes de excluir)
  contarVinculos: (tipo: VinculoTipo, id: string) => string[];
  // Alerta
  updateAlerta: (id: string, patch: Partial<Alerta>) => Result<Alerta>;
  // Ação de mitigação CRUD
  createAcao: (input: AcaoInput) => Result<AcaoMitigacao>;
  updateAcao: (id: string, input: AcaoInput) => Result<AcaoMitigacao>;
  deleteAcao: (id: string) => VoidResult;
  // Utilitários
  resetLocalData: () => void;
  refreshFromApi: () => void;
  apiError: string | null;
  clearApiError: () => void;
  apiSuccess: string | null;
  clearApiSuccess: () => void;
}

const DataContext = createContext<DataContextValue | null>(null);

function isMissing(v: unknown) {
  return v === undefined || v === null || String(v).trim() === '';
}

function pluralize(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

function countUnidades(empresas: Empresa[], unidades: Unidade[]): Empresa[] {
  return empresas.map(e => ({ ...e, unidades: unidades.filter(u => u.empresaId === e.id).length }));
}


function nomeRota(rota?: Rota): string | undefined {
  if (!rota) return undefined;
  return rota.nome?.trim() || `${rota.origem} → ${rota.destino}`;
}

function normalizeEmissoesPorViagem(emissoes: Emissao[]): Emissao[] {
  const vistos = new Set<string>();
  return emissoes.filter(emissao => {
    if (!emissao.viagemId) return true;
    if (vistos.has(emissao.viagemId)) return false;
    vistos.add(emissao.viagemId);
    return true;
  });
}

function alertaRefereViagem(alerta: Alerta, viagemId: string): boolean {
  return alerta.viagemId === viagemId || alerta.descricao.includes(`viagem ${viagemId}`) || alerta.descricao.includes(viagemId);
}

function buildViagemView(input: ViagemInput, database: Database, current?: Viagem): Viagem {
  const caminhaoId = String(input.caminhaoId ?? current?.caminhaoId ?? '');
  const motoristaId = String(input.motoristaId ?? current?.motoristaId ?? '');
  const rotaId = String(input.rotaId ?? current?.rotaId ?? '');
  const combustivelId = String(input.combustivelId ?? current?.combustivelId ?? '');
  const caminhao = database.caminhoes.find(c => c.id === caminhaoId);
  const motorista = database.motoristas.find(m => m.id === motoristaId);
  const rota = database.rotas.find(r => r.id === rotaId);
  const empresa = caminhao ? database.empresas.find(e => e.id === caminhao.empresaId) : undefined;

  return {
    id: current?.id ?? nextCode(database.viagens, 'VGM-', 3),
    dataViagem: String(input.dataViagem ?? current?.dataViagem ?? ''),
    cargaTransportadaKg: Number(input.cargaTransportadaKg ?? current?.cargaTransportadaKg ?? 0),
    distanciaPercorridaKm: Number(input.distanciaPercorridaKm ?? current?.distanciaPercorridaKm ?? rota?.distanciaKm ?? 0),
    caminhaoId,
    motoristaId,
    rotaId,
    combustivelId,
    placa: caminhao?.placa ?? current?.placa,
    motorista: motorista?.nome ?? current?.motorista,
    rota: nomeRota(rota) ?? current?.rota,
    empresa: empresa?.nome ?? current?.empresa,
    empresaId: caminhao?.empresaId ?? current?.empresaId,
    status: input.status ?? current?.status ?? 'planejada',
  };
}

function calcularEmissaoMock(viagem: Viagem, combustivel?: Combustivel): Omit<Emissao, 'id'> {
  const fator = Number(combustivel?.fatorEmissaoCarbono ?? 2.68);
  const { co2Kg, consumoLitros } = calcCo2Viagem(viagem.distanciaPercorridaKm, fator, viagem.cargaTransportadaKg);
  return {
    viagemId: viagem.id,
    consumoEstimadoLitros: consumoLitros,
    co2EmitidoKg: co2Kg,
    indiceImpactoAmbiental: nivelImpacto(co2Kg),
    dataCalculo: new Date().toISOString().slice(0, 10),
  };
}

function upsertEmissaoPorViagem(database: Database, viagem: Viagem, calculada: Omit<Emissao, 'id'>): { emissao: Emissao; emissoes: Emissao[] } {
  const atual = database.emissoes.find(e => e.viagemId === viagem.id);
  const emissao: Emissao = {
    ...calculada,
    id: atual?.id ?? nextCode(database.emissoes, 'EMI-', 3),
    viagemId: viagem.id,
  };
  const outras = normalizeEmissoesPorViagem(database.emissoes.filter(e => e.viagemId !== viagem.id));
  return { emissao, emissoes: [emissao, ...outras] };
}

function upsertAlertaAmbiental(database: Database, viagem: Viagem, emissao: Emissao): Alerta[] {
  const existente = database.alertas.find(a => alertaRefereViagem(a, viagem.id));
  const outros = database.alertas.filter(a => !alertaRefereViagem(a, viagem.id));
  if (emissao.indiceImpactoAmbiental === 'baixo') return outros;

  const nivel = emissao.indiceImpactoAmbiental === 'alto' ? 'critico' : 'atencao';
  const alerta: Alerta = {
    id: existente?.id ?? nextCode(database.alertas, 'ALT-', 3),
    tipo: emissao.indiceImpactoAmbiental === 'alto' ? 'Emissão elevada' : 'Atenção ambiental',
    descricao: `A viagem ${viagem.id} gerou impacto ambiental ${emissao.indiceImpactoAmbiental}.`,
    nivel,
    dataGeracao: new Date().toISOString().slice(0, 10),
    empresaId: viagem.empresaId ?? '',
    empresa: viagem.empresa,
    viagemId: viagem.id,
    lido: existente?.lido ?? false,
    resolvido: false,
  };
  return [alerta, ...outros];
}

// Tenta a API; se falhar, usa cache local (pode ser [])
async function fetchOrCache<T>(
  path: string,
  mapper: (r: Record<string, unknown>) => T,
  cacheKey: keyof Database,
): Promise<{ data: T[]; fromApi: boolean }> {
  try {
    const data = await apiRequest<Record<string, unknown>[]>(path);
    const result = data.map(mapper);
    writeStorage(cacheKey as Parameters<typeof writeStorage>[0], result as never[]);
    return { data: result, fromApi: true };
  } catch {
    return { data: readStorage<T>(cacheKey as Parameters<typeof readStorage>[0]), fromApi: false };
  }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Database>(() => applyTombstones(loadAllStorage()));
  const [loading, setLoading] = useState(isApiEnabled);
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(isApiEnabled ? null : false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(() => new Date().toISOString());
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);
  const mode: DataMode = isApiEnabled ? 'api' : 'mock';

  const fetchAllRef = useRef<(silent?: boolean) => void>(() => {});

  const fetchAll = (silent = false) => {
    if (!isApiEnabled) return;
    if (!silent) setLoading(true);
    Promise.allSettled([
      fetchOrCache('/empresas', toEmpresa, 'empresas'),
      fetchOrCache('/caminhoes', toCaminhao, 'caminhoes'),
      fetchOrCache('/motoristas', toMotorista, 'motoristas'),
      fetchOrCache('/rotas', toRota, 'rotas'),
      fetchOrCache('/viagens', toViagem, 'viagens'),
      fetchOrCache('/emissoes', toEmissao, 'emissoes'),
      fetchOrCache('/alertas', toAlerta, 'alertas'),
      fetchOrCache('/combustiveis', toCombustivel, 'combustiveis'),
    ]).then(results => {
      const payloads = results.map(r =>
        r.status === 'fulfilled' ? r.value : { data: [], fromApi: false }
      );
      setApiAvailable(payloads.some(p => p.fromApi));
      const [emp, cam, mot, rot, vgm, em, al, comb] = payloads.map(p => p.data);
      const unidades = readStorage<Unidade>('unidades');
      const empresas = countUnidades(emp as Empresa[], unidades);
      const caminhoesList = cam as Caminhao[];
      const motoristasList = mot as Motorista[];
      const rotasList = rot as Rota[];
      // A API não retorna campos denormalizados na viagem (placa, motorista, rota,
      // empresa). Enriquecemos a partir das entidades relacionadas para a tabela e
      // o KPI de empresas não ficarem em branco.
      const viagens = (vgm as Viagem[]).map(v => {
        const caminhao = caminhoesList.find(c => c.id === v.caminhaoId);
        const motorista = motoristasList.find(m => m.id === v.motoristaId);
        const rota = rotasList.find(r => r.id === v.rotaId);
        const empresa = caminhao ? (emp as Empresa[]).find(e => e.id === caminhao.empresaId) : undefined;
        return {
          ...v,
          placa: v.placa ?? caminhao?.placa,
          motorista: v.motorista ?? motorista?.nome,
          rota: v.rota ?? nomeRota(rota),
          empresa: v.empresa ?? empresa?.nome,
          empresaId: v.empresaId ?? caminhao?.empresaId,
        };
      });
      const combustiveis = comb as Combustivel[];

      // Fill dataCalculo from viagem.dataViagem when API Emissao doesn't carry it
      let emissoes: Emissao[] = (em as Emissao[]).map(e => {
        if (e.dataCalculo) return e;
        const v = viagens.find(vg => vg.id === e.viagemId);
        return { ...e, dataCalculo: v?.dataViagem ?? '' };
      });

      // When API returns no emissoes but has viagens, compute locally so dashboard has data
      if (emissoes.length === 0 && viagens.length > 0) {
        emissoes = viagens.map(viagem => {
          const combustivel = combustiveis.find(c => c.id === viagem.combustivelId);
          const calc = calcularEmissaoMock(viagem, combustivel);
          return { ...calc, id: `EMI-${viagem.id}`, dataCalculo: viagem.dataViagem };
        });
      }

      let alertas = al as Alerta[];
      // When API returns no alertas, derive them from emissoes so dashboard has data
      if (alertas.length === 0 && emissoes.length > 0) {
        const seedDb = {
          empresas, caminhoes: caminhoesList, motoristas: motoristasList,
          rotas: rotasList, viagens, emissoes, alertas: [] as Alerta[],
          acoes: [] as AcaoMitigacao[], unidades, combustiveis,
        };
        alertas = emissoes.reduce((acc: Alerta[], emissao) => {
          const viagem = viagens.find(v => v.id === emissao.viagemId);
          if (!viagem) return acc;
          return upsertAlertaAmbiental({ ...seedDb, alertas: acc }, viagem, emissao);
        }, []);
      }

      const newDb: Database = applyTombstones({
        empresas,
        caminhoes: caminhoesList,
        motoristas: motoristasList,
        rotas: rotasList,
        viagens,
        emissoes: normalizeEmissoesPorViagem(emissoes),
        alertas,
        acoes: readStorage<AcaoMitigacao>('acoes'),
        unidades,
        combustiveis,
      });
      setDb(newDb);
      setLastUpdatedAt(new Date().toISOString());
      writeAllStorage(newDb);
    }).finally(() => { if (!silent) setLoading(false); });
  };

  fetchAllRef.current = fetchAll;

  // Envia operação à API em background. Ao concluir re-sincroniza; em erro reverte estado local.
  const syncApi = (call: () => Promise<unknown>, revert?: () => void, successMsg?: string) => {
    call()
      .then(() => {
        if (successMsg) setApiSuccess(successMsg);
        fetchAllRef.current(true);
      })
      .catch((err: unknown) => {
        const msg = (err as Error).message;
        console.error('[API]', msg);
        setApiError(msg);
        revert?.();
        // Reconcilia com o backend: corrige referências obsoletas (ex.: rota/caminhão
        // que não existem mais no servidor) que causaram a falha, sem deixar lixo local.
        fetchAllRef.current(true);
      });
  };

  const deleteErrorMsg = (err: unknown) =>
    isDependencyError(err)
      ? 'Não é possível excluir este item porque existem registros vinculados.'
      : (err as Error).message;

  useEffect(() => { fetchAll(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const commit = (next: Database) => {
    const normalized = { ...next, emissoes: normalizeEmissoesPorViagem(next.emissoes), empresas: countUnidades(next.empresas, next.unidades) };
    setDb(normalized);
    setLastUpdatedAt(new Date().toISOString());
    writeAllStorage(normalized);
    return normalized;
  };

  const value = useMemo<DataContextValue>(() => ({
    ...db,
    allEmpresas: db.empresas,
    empresas: db.empresas.filter(e => e.ativo !== false),
    loading,
    mode,
    modeLabel: loading
      ? 'Sincronizando · buscando dados da API'
      : mode === 'api'
        ? apiAvailable
          ? 'API conectada · backend Java'
          : 'API indisponível · verifique VITE_API_BASE_URL'
        : API_BASE_URL
          ? 'API indisponível · verifique VITE_API_BASE_URL'
          : 'VITE_API_BASE_URL não configurada',
    lastUpdatedAt,

    // ── EMPRESA ──────────────────────────────────────────────
    createEmpresa(input) {
      if (isMissing(input.nome)) return { ok: false, error: 'Informe o nome da empresa.' };
      if (isMissing(input.cnpj)) return { ok: false, error: 'Informe o CNPJ.' };
      if (!isCnpjLengthValid(String(input.cnpj))) return { ok: false, error: 'CNPJ deve ter 14 dígitos.' };
      if (isMissing(input.setor)) return { ok: false, error: 'Informe o setor.' };
      if (isMissing(input.cidade)) return { ok: false, error: 'Informe a cidade.' };
      if (isMissing(input.estado)) return { ok: false, error: 'Informe o estado.' };
      if (!(Number(input.metaMensal) > 0)) return { ok: false, error: 'A meta de consumo deve ser maior que zero.' };
      const cnpjNorm = normalizeCnpj(String(input.cnpj));
      if (db.empresas.some(e => e.ativo !== false && normalizeCnpj(e.cnpj) === cnpjNorm))
        return { ok: false, error: 'CNPJ já cadastrado.' };
      const nome = String(input.nome).trim();
      const id = nextCode(db.empresas, 'EMP-', 3);
      const empresa: Empresa = {
        id,
        nome,
        cnpj: String(input.cnpj).trim(),
        setor: String(input.setor),
        cidade: String(input.cidade).trim(),
        estado: String(input.estado).toUpperCase().slice(0, 2),
        responsavel: String(input.responsavel ?? '').trim(),
        dataCadastro: new Date().toISOString().slice(0, 10),
        sigla: String(input.sigla ?? '').toUpperCase().slice(0, 2) || buildSigla(nome),
        cor: String(input.cor ?? CORES_EMPRESA[db.empresas.length % CORES_EMPRESA.length]),
        metaMensal: Number(input.metaMensal ?? 0),
        emissaoMes: 0,
        status: statusMeta(0, Number(input.metaMensal ?? 1)),
        unidades: 0,
        tendencia: [0, 0, 0, 0, 0, 0],
        ativo: true,
      };
      const prev = db.empresas;
      const next = commit({ ...db, empresas: [empresa, ...db.empresas] });
      syncApi(() => svcCriarEmpresa(empresa), () => commit({ ...db, empresas: prev }), 'Empresa criada com sucesso.');
      return { ok: true, data: next.empresas.find(e => e.id === id) ?? empresa };
    },
    updateEmpresa(id, input) {
      const current = db.empresas.find(e => e.id === id);
      if (!current) return { ok: false, error: 'Empresa não encontrada.' };
      if (isMissing(input.nome)) return { ok: false, error: 'Informe o nome.' };
      if (!(Number(input.metaMensal ?? current.metaMensal) > 0)) return { ok: false, error: 'A meta de consumo deve ser maior que zero.' };
      const cnpjNorm = normalizeCnpj(String(input.cnpj ?? current.cnpj));
      if (db.empresas.some(e => e.id !== id && e.ativo !== false && normalizeCnpj(e.cnpj) === cnpjNorm))
        return { ok: false, error: 'CNPJ já cadastrado em outra empresa.' };
      const nome = String(input.nome ?? current.nome).trim();
      const empresa: Empresa = {
        ...current, ...input, nome,
        estado: String(input.estado ?? current.estado).toUpperCase().slice(0, 2),
        sigla: String(input.sigla ?? current.sigla ?? '').toUpperCase().slice(0, 2) || buildSigla(nome),
        status: statusMeta(Number(input.emissaoMes ?? current.emissaoMes), Number(input.metaMensal ?? current.metaMensal) || 1),
        tendencia: input.tendencia?.length ? input.tendencia : current.tendencia,
      };
      const prev = db.empresas;
      const next = commit({ ...db, empresas: db.empresas.map(e => e.id === id ? empresa : e), unidades: db.unidades.map(u => u.empresaId === id ? { ...u, empresa: empresa.nome } : u) });
      syncApi(() => svcAtualizarEmpresa(id, empresa), () => commit({ ...db, empresas: prev }), 'Empresa atualizada com sucesso.');
      return { ok: true, data: next.empresas.find(e => e.id === id) ?? empresa };
    },
    async deleteEmpresa(id) {
      if (!db.empresas.some(e => e.id === id)) return { ok: false, error: 'Empresa não encontrada.' };
      const caminhoesFilhos = db.caminhoes.filter(c => c.empresaId === id);
      const motoristasFilhos = db.motoristas.filter(m => m.empresaId === id);
      const camIds = new Set(caminhoesFilhos.map(c => c.id));
      const motIds = new Set(motoristasFilhos.map(m => m.id));
      const viagensFilhas = db.viagens.filter(v => camIds.has(v.caminhaoId) || motIds.has(v.motoristaId) || v.empresaId === id);
      const vgmIds = new Set(viagensFilhas.map(v => v.id));

      if (!isApiEnabled) {
        commit({
          ...db,
          empresas: db.empresas.map(e => e.id === id ? { ...e, ativo: false } : e),
          caminhoes: db.caminhoes.map(c => camIds.has(c.id) ? { ...c, ativo: false } : c),
          motoristas: db.motoristas.map(m => motIds.has(m.id) ? { ...m, ativo: false } : m),
          viagens: db.viagens.filter(v => !vgmIds.has(v.id)),
          emissoes: db.emissoes.filter(e => !vgmIds.has(e.viagemId)),
          alertas: db.alertas.filter(a => a.empresaId !== id && !(a.viagemId && vgmIds.has(a.viagemId))),
        });
        setApiSuccess('Empresa excluída com sucesso.');
        return { ok: true };
      }

      try {
        for (const v of viagensFilhas) await svcRemoverViagem(v.id);
        for (const c of caminhoesFilhos) await svcRemoverCaminhao(c.id);
        for (const m of motoristasFilhos) await svcRemoverMotorista(m.id);
        await svcRemoverEmpresa(id);
        addTombstones({ empresas: [id], caminhoes: [...camIds], motoristas: [...motIds], viagens: [...vgmIds] });
        setApiSuccess('Empresa excluída com sucesso.');
        fetchAllRef.current(true);
        return { ok: true };
      } catch (err) {
        const msg = deleteErrorMsg(err);
        setApiError(msg);
        return { ok: false, error: msg };
      }
    },

    // ── UNIDADE ──────────────────────────────────────────────
    createUnidade(input) {
      if (isMissing(input.nome)) return { ok: false, error: 'Informe o nome da unidade.' };
      if (isMissing(input.empresaId)) return { ok: false, error: 'Selecione a empresa.' };
      const empresa = db.empresas.find(e => e.id === input.empresaId && e.ativo !== false);
      if (!empresa) return { ok: false, error: 'Empresa não encontrada ou inativa.' };
      const unidade: Unidade = {
        id: nextCode(db.unidades, 'UN-', 4),
        nome: String(input.nome).trim(),
        empresaId: String(input.empresaId),
        empresa: empresa.nome,
        tipo: String(input.tipo ?? 'Fábrica'),
        lat: Number(input.lat ?? 0),
        lon: Number(input.lon ?? 0),
        area: Number(input.area ?? 0),
        coberturaVeg: Number(input.coberturaVeg ?? 0),
        tempMedia: Number(input.tempMedia ?? 0),
        risco: (input.risco ?? 'baixo') as Unidade['risco'],
        emissaoMes: Number(input.emissaoMes ?? 0),
        uf: String(input.uf ?? 'SP').toUpperCase().slice(0, 2),
      };
      commit({ ...db, unidades: [unidade, ...db.unidades] });
      return { ok: true, data: unidade, message: 'Unidade criada.' };
    },
    updateUnidade(id, input) {
      const current = db.unidades.find(u => u.id === id);
      if (!current) return { ok: false, error: 'Unidade não encontrada.' };
      const empresa = db.empresas.find(e => e.id === (input.empresaId ?? current.empresaId));
      const unidade: Unidade = { ...current, ...input, empresa: empresa?.nome ?? current.empresa, uf: String(input.uf ?? current.uf).toUpperCase().slice(0, 2) };
      commit({ ...db, unidades: db.unidades.map(u => u.id === id ? unidade : u) });
      return { ok: true, data: unidade, message: 'Unidade atualizada.' };
    },
    deleteUnidade(id) {
      if (!db.unidades.some(u => u.id === id)) return { ok: false, error: 'Unidade não encontrada.' };
      commit({ ...db, unidades: db.unidades.filter(u => u.id !== id) });
      return { ok: true, message: 'Unidade removida.' };
    },

    // ── CAMINHÃO ─────────────────────────────────────────────
    createCaminhao(input) {
      if (isMissing(input.placa)) return { ok: false, error: 'Informe a placa.' };
      if (isMissing(input.modelo)) return { ok: false, error: 'Informe o modelo.' };
      if (isMissing(input.empresaId)) return { ok: false, error: 'Selecione a empresa.' };
      if (!Number.isFinite(Number(input.empresaId))) return { ok: false, error: 'Empresa não sincronizada com a API. Cadastre a empresa primeiro.' };
      const placa = String(input.placa).toUpperCase().trim();
      if (db.caminhoes.some(c => c.ativo !== false && c.placa.replace(/\W/g, '') === placa.replace(/\W/g, '')))
        return { ok: false, error: 'Placa já cadastrada.' };
      const empresa = db.empresas.find(e => e.id === input.empresaId);
      const cam: Caminhao = {
        id: nextCode(db.caminhoes, 'CAM-', 3),
        placa,
        modelo: String(input.modelo).trim(),
        anoFabricacao: Number(input.anoFabricacao ?? new Date().getFullYear()),
        capacidadeCarga: Number(input.capacidadeCarga ?? 0),
        empresaId: String(input.empresaId),
        empresa: empresa?.nome ?? '',
        ativo: true,
      };
      const prevCam = db.caminhoes;
      commit({ ...db, caminhoes: [cam, ...db.caminhoes] });
      syncApi(() => svcCriarCaminhao(cam), () => commit({ ...db, caminhoes: prevCam }), 'Caminhão cadastrado com sucesso.');
      return { ok: true, data: cam };
    },
    updateCaminhao(id, input) {
      const current = db.caminhoes.find(c => c.id === id);
      if (!current) return { ok: false, error: 'Caminhão não encontrado.' };
      const placa = String(input.placa ?? current.placa).toUpperCase().trim();
      if (db.caminhoes.some(c => c.id !== id && c.ativo !== false && c.placa.replace(/\W/g, '') === placa.replace(/\W/g, '')))
        return { ok: false, error: 'Placa já cadastrada em outro caminhão.' };
      const empresa = db.empresas.find(e => e.id === (input.empresaId ?? current.empresaId));
      const cam: Caminhao = { ...current, ...input, placa, empresa: empresa?.nome ?? current.empresa };
      const prevCamU = db.caminhoes;
      commit({ ...db, caminhoes: db.caminhoes.map(c => c.id === id ? cam : c) });
      syncApi(() => svcAtualizarCaminhao(id, cam), () => commit({ ...db, caminhoes: prevCamU }), 'Caminhão atualizado com sucesso.');
      return { ok: true, data: cam };
    },
    async deleteCaminhao(id) {
      if (!db.caminhoes.some(c => c.id === id)) return { ok: false, error: 'Caminhão não encontrado.' };
      const viagensFilhas = db.viagens.filter(v => v.caminhaoId === id);
      const vgmIds = new Set(viagensFilhas.map(v => v.id));

      if (!isApiEnabled) {
        commit({
          ...db,
          caminhoes: db.caminhoes.map(c => c.id === id ? { ...c, ativo: false } : c),
          viagens: db.viagens.filter(v => !vgmIds.has(v.id)),
          emissoes: db.emissoes.filter(e => !vgmIds.has(e.viagemId)),
          alertas: db.alertas.filter(a => !(a.viagemId && vgmIds.has(a.viagemId))),
        });
        setApiSuccess('Caminhão excluído com sucesso.');
        return { ok: true };
      }

      try {
        for (const v of viagensFilhas) await svcRemoverViagem(v.id);
        await svcRemoverCaminhao(id);
        addTombstones({ caminhoes: [id], viagens: [...vgmIds] });
        setApiSuccess('Caminhão excluído com sucesso.');
        fetchAllRef.current(true);
        return { ok: true };
      } catch (err) {
        const msg = deleteErrorMsg(err);
        setApiError(msg);
        return { ok: false, error: msg };
      }
    },

    // ── MOTORISTA ────────────────────────────────────────────
    createMotorista(input) {
      if (isMissing(input.nome)) return { ok: false, error: 'Informe o nome.' };
      if (isMissing(input.cpf)) return { ok: false, error: 'Informe o CPF.' };
      if (isMissing(input.empresaId)) return { ok: false, error: 'Selecione a empresa.' };
      if (!Number.isFinite(Number(input.empresaId))) return { ok: false, error: 'Empresa não sincronizada com a API. Cadastre a empresa primeiro.' };
      const cpfNum = String(input.cpf).replace(/\D/g, '');
      if (cpfNum.length !== 11) return { ok: false, error: 'CPF deve ter 11 dígitos.' };
      if (db.motoristas.some(m => m.ativo !== false && m.cpf.replace(/\D/g, '') === cpfNum))
        return { ok: false, error: 'CPF já cadastrado.' };
      const empresa = db.empresas.find(e => e.id === input.empresaId);
      const mot: Motorista = {
        id: nextCode(db.motoristas, 'MOT-', 3),
        nome: String(input.nome).trim(),
        cpf: String(input.cpf),
        numeroCnh: String(input.numeroCnh ?? '').replace(/\D/g, ''),
        validadeCnh: String(input.validadeCnh ?? ''),
        empresaId: String(input.empresaId),
        empresa: empresa?.nome ?? '',
        ativo: true,
      };
      const prevMot = db.motoristas;
      commit({ ...db, motoristas: [mot, ...db.motoristas] });
      syncApi(() => svcCriarMotorista(mot), () => commit({ ...db, motoristas: prevMot }), 'Motorista cadastrado com sucesso.');
      return { ok: true, data: mot };
    },
    updateMotorista(id, input) {
      const current = db.motoristas.find(m => m.id === id);
      if (!current) return { ok: false, error: 'Motorista não encontrado.' };
      if (isMissing(input.nome)) return { ok: false, error: 'Informe o nome.' };
      const cpfNum = String(input.cpf ?? current.cpf).replace(/\D/g, '');
      if (db.motoristas.some(m => m.id !== id && m.ativo !== false && m.cpf.replace(/\D/g, '') === cpfNum))
        return { ok: false, error: 'CPF já cadastrado em outro motorista.' };
      const empresa = db.empresas.find(e => e.id === (input.empresaId ?? current.empresaId));
      const mot: Motorista = { ...current, ...input, nome: String(input.nome).trim(), cpf: String(input.cpf ?? current.cpf), numeroCnh: String(input.numeroCnh ?? current.numeroCnh).replace(/\D/g, ''), empresa: empresa?.nome ?? current.empresa };
      const prevMotU = db.motoristas;
      commit({ ...db, motoristas: db.motoristas.map(m => m.id === id ? mot : m) });
      syncApi(() => svcAtualizarMotorista(id, mot), () => commit({ ...db, motoristas: prevMotU }), 'Motorista atualizado com sucesso.');
      return { ok: true, data: mot };
    },
    async deleteMotorista(id) {
      if (!db.motoristas.some(m => m.id === id)) return { ok: false, error: 'Motorista não encontrado.' };
      const viagensFilhas = db.viagens.filter(v => v.motoristaId === id);
      const vgmIds = new Set(viagensFilhas.map(v => v.id));

      if (!isApiEnabled) {
        commit({
          ...db,
          motoristas: db.motoristas.map(m => m.id === id ? { ...m, ativo: false } : m),
          viagens: db.viagens.filter(v => !vgmIds.has(v.id)),
          emissoes: db.emissoes.filter(e => !vgmIds.has(e.viagemId)),
          alertas: db.alertas.filter(a => !(a.viagemId && vgmIds.has(a.viagemId))),
        });
        setApiSuccess('Motorista excluído com sucesso.');
        return { ok: true };
      }

      try {
        for (const v of viagensFilhas) await svcRemoverViagem(v.id);
        await svcRemoverMotorista(id);
        addTombstones({ motoristas: [id], viagens: [...vgmIds] });
        setApiSuccess('Motorista excluído com sucesso.');
        fetchAllRef.current(true);
        return { ok: true };
      } catch (err) {
        const msg = deleteErrorMsg(err);
        setApiError(msg);
        return { ok: false, error: msg };
      }
    },

    // ── ROTA ─────────────────────────────────────────────────
    createRota(input) {
      if (isMissing(input.nome)) return { ok: false, error: 'Informe o nome da rota.' };
      if (isMissing(input.origem)) return { ok: false, error: 'Informe a origem.' };
      if (isMissing(input.destino)) return { ok: false, error: 'Informe o destino.' };
      if (!Number.isFinite(Number(input.distanciaKm)) || Number(input.distanciaKm) <= 0)
        return { ok: false, error: 'Informe uma distância válida.' };
      const rota: Rota = {
        id: nextCode(db.rotas, 'ROT-', 3),
        nome: String(input.nome).trim(),
        origem: String(input.origem).trim(),
        destino: String(input.destino).trim(),
        distanciaKm: Number(input.distanciaKm),
        regiao: String(input.regiao ?? '').trim(),
        origemLat: input.origemLat === undefined ? undefined : Number(input.origemLat),
        origemLon: input.origemLon === undefined ? undefined : Number(input.origemLon),
        destinoLat: input.destinoLat === undefined ? undefined : Number(input.destinoLat),
        destinoLon: input.destinoLon === undefined ? undefined : Number(input.destinoLon),
        ativo: true,
      };
      const prevRot = db.rotas;
      commit({ ...db, rotas: [rota, ...db.rotas] });
      syncApi(() => svcCriarRota(rota), () => commit({ ...db, rotas: prevRot }), 'Rota cadastrada com sucesso.');
      return { ok: true, data: rota };
    },
    updateRota(id, input) {
      const current = db.rotas.find(r => r.id === id);
      if (!current) return { ok: false, error: 'Rota não encontrada.' };
      const rota: Rota = {
        ...current,
        ...input,
        nome: String(input.nome ?? current.nome ?? `${input.origem ?? current.origem} → ${input.destino ?? current.destino}`).trim(),
        origem: String(input.origem ?? current.origem).trim(),
        destino: String(input.destino ?? current.destino).trim(),
        distanciaKm: Number(input.distanciaKm ?? current.distanciaKm),
        regiao: String(input.regiao ?? current.regiao ?? '').trim(),
        origemLat: input.origemLat === undefined ? current.origemLat : Number(input.origemLat),
        origemLon: input.origemLon === undefined ? current.origemLon : Number(input.origemLon),
        destinoLat: input.destinoLat === undefined ? current.destinoLat : Number(input.destinoLat),
        destinoLon: input.destinoLon === undefined ? current.destinoLon : Number(input.destinoLon),
      };
      const prevRotU = db.rotas;
      commit({ ...db, rotas: db.rotas.map(r => r.id === id ? rota : r) });
      syncApi(() => svcAtualizarRota(id, rota), () => commit({ ...db, rotas: prevRotU }), 'Rota atualizada com sucesso.');
      return { ok: true, data: rota };
    },
    async deleteRota(id) {
      if (!db.rotas.some(r => r.id === id)) return { ok: false, error: 'Rota não encontrada.' };
      const viagensFilhas = db.viagens.filter(v => v.rotaId === id);
      const vgmIds = new Set(viagensFilhas.map(v => v.id));

      if (!isApiEnabled) {
        commit({
          ...db,
          rotas: db.rotas.map(r => r.id === id ? { ...r, ativo: false } : r),
          viagens: db.viagens.filter(v => !vgmIds.has(v.id)),
          emissoes: db.emissoes.filter(e => !vgmIds.has(e.viagemId)),
          alertas: db.alertas.filter(a => !(a.viagemId && vgmIds.has(a.viagemId))),
        });
        setApiSuccess('Rota excluída com sucesso.');
        return { ok: true };
      }

      try {
        for (const v of viagensFilhas) await svcRemoverViagem(v.id);
        await svcRemoverRota(id);
        addTombstones({ rotas: [id], viagens: [...vgmIds] });
        setApiSuccess('Rota excluída com sucesso.');
        fetchAllRef.current(true);
        return { ok: true };
      } catch (err) {
        const msg = deleteErrorMsg(err);
        setApiError(msg);
        return { ok: false, error: msg };
      }
    },

    // ── VIAGEM ───────────────────────────────────────────────
    createViagem(input) {
      if (isMissing(input.caminhaoId)) return { ok: false, error: 'Selecione o caminhão.' };
      if (isMissing(input.motoristaId)) return { ok: false, error: 'Selecione o motorista.' };
      if (isMissing(input.rotaId)) return { ok: false, error: 'Selecione a rota.' };
      if (isMissing(input.combustivelId)) return { ok: false, error: 'Selecione o combustível.' };
      if (!Number.isFinite(Number(input.distanciaPercorridaKm)) || Number(input.distanciaPercorridaKm) <= 0)
        return { ok: false, error: 'Informe a distância percorrida (deve ser maior que zero).' };
      if (!Number.isFinite(Number(input.cargaTransportadaKg)) || Number(input.cargaTransportadaKg) <= 0)
        return { ok: false, error: 'Informe a carga transportada (deve ser maior que zero).' };
      if (isMissing(input.dataViagem)) return { ok: false, error: 'Informe a data da viagem.' };
      if (new Date(String(input.dataViagem)) > new Date()) return { ok: false, error: 'A data da viagem não pode ser futura.' };
      if (!Number.isFinite(Number(input.caminhaoId))) return { ok: false, error: 'Caminhão não sincronizado com a API. Recadastre o caminhão.' };
      if (!Number.isFinite(Number(input.motoristaId))) return { ok: false, error: 'Motorista não sincronizado com a API. Recadastre o motorista.' };
      if (!Number.isFinite(Number(input.rotaId))) return { ok: false, error: 'Rota não sincronizada com a API. Recadastre a rota.' };
      if (!Number.isFinite(Number(input.combustivelId))) return { ok: false, error: 'Combustível inválido. Recarregue a página.' };

      const viagem = buildViagemView(input, db);
      const combustivel = db.combustiveis.find(c => c.id === viagem.combustivelId);
      const calculada = calcularEmissaoMock(viagem, combustivel);
      const { emissao, emissoes } = upsertEmissaoPorViagem(db, viagem, calculada);
      const alertas = upsertAlertaAmbiental({ ...db, emissoes }, viagem, emissao);
      const prevVgm = { viagens: db.viagens, emissoes: db.emissoes, alertas: db.alertas };
      commit({ ...db, viagens: [viagem, ...db.viagens], emissoes, alertas });
      syncApi(() => svcCriarViagem(viagem), () => commit({ ...db, ...prevVgm }), 'Viagem registrada com sucesso.');
      return { ok: true, data: viagem };
    },
    updateViagem(id, input) {
      const current = db.viagens.find(v => v.id === id);
      if (!current) return { ok: false, error: 'Viagem não encontrada.' };
      const mergedInput = { ...current, ...input };
      if (!Number.isFinite(Number(mergedInput.distanciaPercorridaKm)) || Number(mergedInput.distanciaPercorridaKm) <= 0)
        return { ok: false, error: 'Informe a distância percorrida (deve ser maior que zero).' };
      if (!Number.isFinite(Number(mergedInput.cargaTransportadaKg)) || Number(mergedInput.cargaTransportadaKg) <= 0)
        return { ok: false, error: 'Informe a carga transportada (deve ser maior que zero).' };
      if (isMissing(mergedInput.dataViagem)) return { ok: false, error: 'Informe a data da viagem.' };
      if (new Date(String(mergedInput.dataViagem)) > new Date()) return { ok: false, error: 'A data da viagem não pode ser futura.' };
      if (!Number.isFinite(Number(mergedInput.caminhaoId))) return { ok: false, error: 'Caminhão não sincronizado com a API. Recadastre o caminhão.' };
      if (!Number.isFinite(Number(mergedInput.motoristaId))) return { ok: false, error: 'Motorista não sincronizado com a API. Recadastre o motorista.' };
      if (!Number.isFinite(Number(mergedInput.rotaId))) return { ok: false, error: 'Rota não sincronizada com a API. Recadastre a rota.' };

      const viagem = buildViagemView(mergedInput, db, current);
      const combustivel = db.combustiveis.find(c => c.id === viagem.combustivelId);
      const calculada = calcularEmissaoMock(viagem, combustivel);
      const { emissao, emissoes } = upsertEmissaoPorViagem(db, viagem, calculada);
      const alertas = upsertAlertaAmbiental({ ...db, emissoes }, viagem, emissao);
      const prevVgmU = { viagens: db.viagens, emissoes: db.emissoes, alertas: db.alertas };
      commit({ ...db, viagens: db.viagens.map(v => v.id === id ? viagem : v), emissoes, alertas });
      syncApi(() => svcAtualizarViagem(id, viagem), () => commit({ ...db, ...prevVgmU }), 'Viagem atualizada com sucesso.');
      return { ok: true, data: viagem };
    },
    async deleteViagem(id) {
      if (!db.viagens.some(v => v.id === id)) return { ok: false, error: 'Viagem não encontrada.' };

      if (!isApiEnabled) {
        commit({
          ...db,
          viagens: db.viagens.filter(v => v.id !== id),
          emissoes: db.emissoes.filter(e => e.viagemId !== id),
          alertas: db.alertas.filter(a => !alertaRefereViagem(a, id)),
        });
        setApiSuccess('Viagem removida com sucesso.');
        return { ok: true };
      }

      try {
        await svcRemoverViagem(id);
        addTombstones({ viagens: [id] });
        setApiSuccess('Viagem removida com sucesso.');
        fetchAllRef.current(true);
        return { ok: true };
      } catch (err) {
        const msg = deleteErrorMsg(err);
        setApiError(msg);
        return { ok: false, error: msg };
      }
    },

    // ── VÍNCULOS ─────────────────────────────────────────────
    // Conta os registros que dependem do item, para avisar no diálogo de
    // exclusão. Espelha exatamente a cascata calculada em cada deleteXxx.
    contarVinculos(tipo, id) {
      const out: string[] = [];
      if (tipo === 'empresa') {
        const camIds = new Set(db.caminhoes.filter(c => c.empresaId === id).map(c => c.id));
        const motIds = new Set(db.motoristas.filter(m => m.empresaId === id).map(m => m.id));
        const cam = db.caminhoes.filter(c => c.empresaId === id && c.ativo !== false).length;
        const mot = db.motoristas.filter(m => m.empresaId === id && m.ativo !== false).length;
        const vgm = db.viagens.filter(v => camIds.has(v.caminhaoId) || motIds.has(v.motoristaId) || v.empresaId === id).length;
        if (cam) out.push(pluralize(cam, 'caminhão', 'caminhões'));
        if (mot) out.push(pluralize(mot, 'motorista', 'motoristas'));
        if (vgm) out.push(pluralize(vgm, 'viagem', 'viagens'));
      } else if (tipo === 'caminhao') {
        const vgm = db.viagens.filter(v => v.caminhaoId === id).length;
        if (vgm) out.push(pluralize(vgm, 'viagem', 'viagens'));
      } else if (tipo === 'motorista') {
        const vgm = db.viagens.filter(v => v.motoristaId === id).length;
        if (vgm) out.push(pluralize(vgm, 'viagem', 'viagens'));
      } else if (tipo === 'rota') {
        const vgm = db.viagens.filter(v => v.rotaId === id).length;
        if (vgm) out.push(pluralize(vgm, 'viagem', 'viagens'));
      } else if (tipo === 'viagem') {
        const em = db.emissoes.filter(e => e.viagemId === id).length;
        if (em) out.push(pluralize(em, 'emissão', 'emissões'));
      }
      return out;
    },

    // ── ALERTA ───────────────────────────────────────────────
    updateAlerta(id, patch) {
      const current = db.alertas.find(a => a.id === id);
      if (!current) return { ok: false, error: 'Alerta não encontrado.' };
      const alerta = { ...current, ...patch };
      commit({ ...db, alertas: db.alertas.map(a => a.id === id ? alerta : a) });
      return { ok: true, data: alerta, message: 'Alerta atualizado.' };
    },

    // ── AÇÃO DE MITIGAÇÃO ────────────────────────────────────
    createAcao(input) {
      if (isMissing(input.tipo)) return { ok: false, error: 'Informe o tipo de ação.' };
      if (isMissing(input.empresaId)) return { ok: false, error: 'Selecione a empresa.' };
      const defaultUnit = db.unidades.find(u => u.empresaId === input.empresaId);
      const acao: AcaoMitigacao = {
        id: nextCode(db.acoes, 'AC-', 3),
        empresaId: String(input.empresaId),
        unidadeId: String(input.unidadeId ?? defaultUnit?.id ?? ''),
        tipo: String(input.tipo).trim(),
        descricao: String(input.descricao ?? ''),
        impactoEstimado: Number(input.impactoEstimado ?? 0),
        status: (input.status ?? 'planejada') as AcaoMitigacao['status'],
        inicio: String(input.inicio ?? new Date().toISOString().slice(0, 10)),
        prazo: String(input.prazo ?? new Date().toISOString().slice(0, 10)),
      };
      commit({ ...db, acoes: [acao, ...db.acoes] });
      return { ok: true, data: acao, message: 'Ação criada.' };
    },
    updateAcao(id, input) {
      const current = db.acoes.find(a => a.id === id);
      if (!current) return { ok: false, error: 'Ação não encontrada.' };
      const acao: AcaoMitigacao = { ...current, ...input };
      commit({ ...db, acoes: db.acoes.map(a => a.id === id ? acao : a) });
      return { ok: true, data: acao, message: 'Ação atualizada.' };
    },
    deleteAcao(id) {
      if (!db.acoes.some(a => a.id === id)) return { ok: false, error: 'Ação não encontrada.' };
      commit({ ...db, acoes: db.acoes.filter(a => a.id !== id) });
      return { ok: true, message: 'Ação removida.' };
    },

    resetLocalData() {
      clearStorage();
      clearTombstones();
      setDb(loadAllStorage());
      setLastUpdatedAt(new Date().toISOString());
    },
    refreshFromApi: fetchAll,
    apiError,
    clearApiError: () => setApiError(null),
    apiSuccess,
    clearApiSuccess: () => setApiSuccess(null),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [db, loading, mode, apiAvailable, lastUpdatedAt, apiError, apiSuccess]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData deve ser usado dentro de DataProvider.');
  return ctx;
}
