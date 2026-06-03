import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { isApiEnabled, FORCE_MOCK, API_BASE_URL, apiRequest } from '../services/api';
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
import { toUnidade } from '../adapters/unidadeAdapter';
import {
  loadAllStorage, writeAllStorage, writeStorage, readStorage, clearStorage,
  type Database,
} from '../lib/storage';
import {
  buildSigla, buildTrend, statusMeta, normalizeCnpj, nextCode,
  calcCo2Viagem, nivelImpacto, CORES_EMPRESA,
} from '../lib/constants';
import { isCnpjLengthValid } from '../utils/validators';

export type DataMode = 'mock' | 'api';
type Result<T> = { ok: true; data: T; message?: string } | { ok: false; error: string };
type VoidResult = { ok: true; message?: string } | { ok: false; error: string };

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
  deleteEmpresa: (id: string) => VoidResult;
  // Unidade CRUD
  createUnidade: (input: UnidadeInput) => Result<Unidade>;
  updateUnidade: (id: string, input: UnidadeInput) => Result<Unidade>;
  deleteUnidade: (id: string) => VoidResult;
  // Caminhão CRUD
  createCaminhao: (input: CaminhaoInput) => Result<Caminhao>;
  updateCaminhao: (id: string, input: CaminhaoInput) => Result<Caminhao>;
  deleteCaminhao: (id: string) => VoidResult;
  // Motorista CRUD
  createMotorista: (input: MotoristaInput) => Result<Motorista>;
  updateMotorista: (id: string, input: MotoristaInput) => Result<Motorista>;
  deleteMotorista: (id: string) => VoidResult;
  // Rota CRUD
  createRota: (input: RotaInput) => Result<Rota>;
  updateRota: (id: string, input: RotaInput) => Result<Rota>;
  deleteRota: (id: string) => VoidResult;
  // Viagem CRUD
  createViagem: (input: ViagemInput) => Result<Viagem>;
  updateViagem: (id: string, input: ViagemInput) => Result<Viagem>;
  deleteViagem: (id: string) => VoidResult;
  // Alerta
  updateAlerta: (id: string, patch: Partial<Alerta>) => Result<Alerta>;
  // Ação de mitigação CRUD
  createAcao: (input: AcaoInput) => Result<AcaoMitigacao>;
  updateAcao: (id: string, input: AcaoInput) => Result<AcaoMitigacao>;
  deleteAcao: (id: string) => VoidResult;
  // Utilitários
  resetLocalData: () => void;
  refreshFromApi: () => void;
}

const DataContext = createContext<DataContextValue | null>(null);

function isMissing(v: unknown) {
  return v === undefined || v === null || String(v).trim() === '';
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
  const [db, setDb] = useState<Database>(() => loadAllStorage());
  const [loading, setLoading] = useState(isApiEnabled);
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(isApiEnabled ? null : false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(() => new Date().toISOString());
  const mode: DataMode = isApiEnabled ? 'api' : 'mock';

  const fetchAll = () => {
    if (!isApiEnabled) return;
    setLoading(true);
    Promise.allSettled([
      fetchOrCache('/empresas', toEmpresa, 'empresas'),
      fetchOrCache('/caminhoes', toCaminhao, 'caminhoes'),
      fetchOrCache('/motoristas', toMotorista, 'motoristas'),
      fetchOrCache('/rotas', toRota, 'rotas'),
      fetchOrCache('/viagens', toViagem, 'viagens'),
      fetchOrCache('/emissoes', toEmissao, 'emissoes'),
      fetchOrCache('/alertas', toAlerta, 'alertas'),
      fetchOrCache('/unidades', toUnidade, 'unidades'),
      fetchOrCache('/combustiveis', toCombustivel, 'combustiveis'),
    ]).then(results => {
      const payloads = results.map(r =>
        r.status === 'fulfilled' ? r.value : { data: [], fromApi: false }
      );
      setApiAvailable(payloads.some(p => p.fromApi));
      const [emp, cam, mot, rot, vgm, em, al, un, comb] = payloads.map(p => p.data);
      const empresas = countUnidades(emp as Empresa[], un as Unidade[]);
      const newDb: Database = {
        empresas,
        caminhoes: cam as Caminhao[],
        motoristas: mot as Motorista[],
        rotas: rot as Rota[],
        viagens: vgm as Viagem[],
        emissoes: normalizeEmissoesPorViagem(em as Emissao[]),
        alertas: al as Alerta[],
        acoes: readStorage<AcaoMitigacao>('acoes'),
        unidades: un as Unidade[],
        combustiveis: comb as Combustivel[],
      };
      setDb(newDb);
      setLastUpdatedAt(new Date().toISOString());
      writeAllStorage(newDb);
    }).finally(() => setLoading(false));
  };

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
      : FORCE_MOCK
        ? 'Modo local forçado · API ignorada'
        : mode === 'api'
          ? apiAvailable
            ? 'API conectada · backend Java'
            : 'API indisponível · usando cache/localStorage'
          : API_BASE_URL
            ? 'API indisponível · usando cache/localStorage'
            : 'Coleta local ativa · mock/localStorage',
    lastUpdatedAt,

    // ── EMPRESA ──────────────────────────────────────────────
    createEmpresa(input) {
      if (isMissing(input.nome)) return { ok: false, error: 'Informe o nome da empresa.' };
      if (isMissing(input.cnpj)) return { ok: false, error: 'Informe o CNPJ.' };
      if (!isCnpjLengthValid(String(input.cnpj))) return { ok: false, error: 'CNPJ deve ter 14 dígitos.' };
      if (isMissing(input.setor)) return { ok: false, error: 'Informe o setor.' };
      if (isMissing(input.cidade)) return { ok: false, error: 'Informe a cidade.' };
      if (isMissing(input.estado)) return { ok: false, error: 'Informe o estado.' };
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
      const next = commit({ ...db, empresas: [empresa, ...db.empresas] });
      return { ok: true, data: next.empresas.find(e => e.id === id) ?? empresa, message: 'Empresa criada.' };
    },
    updateEmpresa(id, input) {
      const current = db.empresas.find(e => e.id === id);
      if (!current) return { ok: false, error: 'Empresa não encontrada.' };
      if (isMissing(input.nome)) return { ok: false, error: 'Informe o nome.' };
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
      const next = commit({ ...db, empresas: db.empresas.map(e => e.id === id ? empresa : e), unidades: db.unidades.map(u => u.empresaId === id ? { ...u, empresa: empresa.nome } : u) });
      return { ok: true, data: next.empresas.find(e => e.id === id) ?? empresa, message: 'Empresa atualizada.' };
    },
    deleteEmpresa(id) {
      if (!db.empresas.some(e => e.id === id)) return { ok: false, error: 'Empresa não encontrada.' };
      commit({ ...db, empresas: db.empresas.map(e => e.id === id ? { ...e, ativo: false } : e) });
      return { ok: true, message: 'Empresa inativada.' };
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
      commit({ ...db, caminhoes: [cam, ...db.caminhoes] });
      return { ok: true, data: cam, message: 'Caminhão cadastrado.' };
    },
    updateCaminhao(id, input) {
      const current = db.caminhoes.find(c => c.id === id);
      if (!current) return { ok: false, error: 'Caminhão não encontrado.' };
      const placa = String(input.placa ?? current.placa).toUpperCase().trim();
      if (db.caminhoes.some(c => c.id !== id && c.ativo !== false && c.placa.replace(/\W/g, '') === placa.replace(/\W/g, '')))
        return { ok: false, error: 'Placa já cadastrada em outro caminhão.' };
      const empresa = db.empresas.find(e => e.id === (input.empresaId ?? current.empresaId));
      const cam: Caminhao = { ...current, ...input, placa, empresa: empresa?.nome ?? current.empresa };
      commit({ ...db, caminhoes: db.caminhoes.map(c => c.id === id ? cam : c) });
      return { ok: true, data: cam, message: 'Caminhão atualizado.' };
    },
    deleteCaminhao(id) {
      if (!db.caminhoes.some(c => c.id === id)) return { ok: false, error: 'Caminhão não encontrado.' };
      commit({ ...db, caminhoes: db.caminhoes.map(c => c.id === id ? { ...c, ativo: false } : c) });
      return { ok: true, message: 'Caminhão inativado.' };
    },

    // ── MOTORISTA ────────────────────────────────────────────
    createMotorista(input) {
      if (isMissing(input.nome)) return { ok: false, error: 'Informe o nome.' };
      if (isMissing(input.cpf)) return { ok: false, error: 'Informe o CPF.' };
      if (isMissing(input.empresaId)) return { ok: false, error: 'Selecione a empresa.' };
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
      commit({ ...db, motoristas: [mot, ...db.motoristas] });
      return { ok: true, data: mot, message: 'Motorista cadastrado.' };
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
      commit({ ...db, motoristas: db.motoristas.map(m => m.id === id ? mot : m) });
      return { ok: true, data: mot, message: 'Motorista atualizado.' };
    },
    deleteMotorista(id) {
      if (!db.motoristas.some(m => m.id === id)) return { ok: false, error: 'Motorista não encontrado.' };
      commit({ ...db, motoristas: db.motoristas.map(m => m.id === id ? { ...m, ativo: false } : m) });
      return { ok: true, message: 'Motorista inativado.' };
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
      commit({ ...db, rotas: [rota, ...db.rotas] });
      return { ok: true, data: rota, message: 'Rota cadastrada.' };
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
      commit({ ...db, rotas: db.rotas.map(r => r.id === id ? rota : r) });
      return { ok: true, data: rota, message: 'Rota atualizada.' };
    },
    deleteRota(id) {
      if (!db.rotas.some(r => r.id === id)) return { ok: false, error: 'Rota não encontrada.' };
      commit({ ...db, rotas: db.rotas.map(r => r.id === id ? { ...r, ativo: false } : r) });
      return { ok: true, message: 'Rota inativada.' };
    },

    // ── VIAGEM ───────────────────────────────────────────────
    createViagem(input) {
      if (isMissing(input.caminhaoId)) return { ok: false, error: 'Selecione o caminhão.' };
      if (isMissing(input.motoristaId)) return { ok: false, error: 'Selecione o motorista.' };
      if (isMissing(input.rotaId)) return { ok: false, error: 'Selecione a rota.' };
      if (isMissing(input.combustivelId)) return { ok: false, error: 'Selecione o combustível.' };
      if (!Number.isFinite(Number(input.distanciaPercorridaKm)) || Number(input.distanciaPercorridaKm) <= 0)
        return { ok: false, error: 'Informe a distância percorrida.' };
      if (isMissing(input.dataViagem)) return { ok: false, error: 'Informe a data da viagem.' };

      const viagem = buildViagemView(input, db);
      const combustivel = db.combustiveis.find(c => c.id === viagem.combustivelId);
      const calculada = calcularEmissaoMock(viagem, combustivel);
      const { emissao, emissoes } = upsertEmissaoPorViagem(db, viagem, calculada);
      const alertas = upsertAlertaAmbiental({ ...db, emissoes }, viagem, emissao);
      commit({ ...db, viagens: [viagem, ...db.viagens], emissoes, alertas });
      return { ok: true, data: viagem, message: 'Viagem registrada com emissão automática local.' };
    },
    updateViagem(id, input) {
      const current = db.viagens.find(v => v.id === id);
      if (!current) return { ok: false, error: 'Viagem não encontrada.' };
      const mergedInput = { ...current, ...input };
      if (!Number.isFinite(Number(mergedInput.distanciaPercorridaKm)) || Number(mergedInput.distanciaPercorridaKm) <= 0)
        return { ok: false, error: 'Informe a distância percorrida.' };
      if (isMissing(mergedInput.dataViagem)) return { ok: false, error: 'Informe a data da viagem.' };

      const viagem = buildViagemView(mergedInput, db, current);
      const combustivel = db.combustiveis.find(c => c.id === viagem.combustivelId);
      const calculada = calcularEmissaoMock(viagem, combustivel);
      const { emissao, emissoes } = upsertEmissaoPorViagem(db, viagem, calculada);
      const alertas = upsertAlertaAmbiental({ ...db, emissoes }, viagem, emissao);
      commit({ ...db, viagens: db.viagens.map(v => v.id === id ? viagem : v), emissoes, alertas });
      return { ok: true, data: viagem, message: 'Viagem atualizada com emissão recalculada.' };
    },
    deleteViagem(id) {
      if (!db.viagens.some(v => v.id === id)) return { ok: false, error: 'Viagem não encontrada.' };
      commit({
        ...db,
        viagens: db.viagens.filter(v => v.id !== id),
        emissoes: db.emissoes.filter(e => e.viagemId !== id),
        alertas: db.alertas.filter(a => !alertaRefereViagem(a, id)),
      });
      return { ok: true, message: 'Viagem removida com emissão e alerta automático vinculados.' };
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
      setDb(loadAllStorage()); // retorna coleções locais limpas com combustíveis seedados
      setLastUpdatedAt(new Date().toISOString());
    },
    refreshFromApi: fetchAll,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [db, loading, mode, apiAvailable, lastUpdatedAt]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData deve ser usado dentro de DataProvider.');
  return ctx;
}
