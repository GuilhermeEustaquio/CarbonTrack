import type { Database } from './storage';

/**
 * Tombstones — registro persistente de IDs excluídos pelo usuário.
 *
 * Motivo: o backend Java/Oracle não faz exclusão em cascata e mantém as
 * emissões como somente leitura. Por isso, registros com vínculos (uma viagem
 * com emissão, um caminhão com viagens, uma empresa com frota) não podem ser
 * removidos via API e voltariam a aparecer a cada re-sincronização do GET.
 *
 * Estes tombstones garantem que, uma vez excluído na interface, o registro
 * permaneça oculto mesmo após o fetch sobrescrever o estado com os dados da API.
 */

const KEY = 'ct:tombstones';

export type TombstoneKey = 'empresas' | 'caminhoes' | 'motoristas' | 'rotas' | 'viagens';

type Tombstones = Record<TombstoneKey, string[]>;

const EMPTY: Tombstones = { empresas: [], caminhoes: [], motoristas: [], rotas: [], viagens: [] };

const can = () => typeof window !== 'undefined' && Boolean(window.localStorage);

export function readTombstones(): Tombstones {
  if (!can()) return { ...EMPTY };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<Tombstones>;
    return {
      empresas: parsed.empresas ?? [],
      caminhoes: parsed.caminhoes ?? [],
      motoristas: parsed.motoristas ?? [],
      rotas: parsed.rotas ?? [],
      viagens: parsed.viagens ?? [],
    };
  } catch {
    return { ...EMPTY };
  }
}

export function addTombstones(patch: Partial<Record<TombstoneKey, string[]>>): void {
  if (!can()) return;
  const current = readTombstones();
  (Object.keys(patch) as TombstoneKey[]).forEach(key => {
    const ids = (patch[key] ?? []).map(String);
    current[key] = Array.from(new Set([...current[key], ...ids]));
  });
  try {
    window.localStorage.setItem(KEY, JSON.stringify(current));
  } catch { /* quota — ignorar */ }
}

export function clearTombstones(): void {
  if (!can()) return;
  window.localStorage.removeItem(KEY);
}

/**
 * Reaplica as exclusões sobre um Database recém-carregado (cache ou API).
 *
 * É **ciente das relações**: além dos IDs marcados diretamente, oculta também
 * os filhos de registros excluídos — caminhões/motoristas de empresas
 * excluídas, e viagens (com suas emissões/alertas) de qualquer empresa,
 * caminhão, motorista ou rota excluído. Isso garante que viagens vindas
 * "frescas" da API não reapareçam quando o pai foi removido.
 *
 * - empresas/caminhões/motoristas/rotas → soft-delete (preserva o nome p/ histórico);
 * - viagens → removidas da lista;
 * - emissões/alertas → removidos quando vinculados a uma viagem removida.
 */
export function applyTombstones(db: Database): Database {
  const t = readTombstones();
  if (!t.empresas.length && !t.caminhoes.length && !t.motoristas.length && !t.rotas.length && !t.viagens.length) {
    return db;
  }

  const empT = new Set(t.empresas.map(String));
  const camT = new Set(t.caminhoes.map(String));
  const motT = new Set(t.motoristas.map(String));
  const rotT = new Set(t.rotas.map(String));
  const vgmT = new Set(t.viagens.map(String));

  // Empresas excluídas → inativas (nome preservado para histórico).
  const empresas = empT.size ? db.empresas.map(e => (empT.has(String(e.id)) ? { ...e, ativo: false } : e)) : db.empresas;

  // Caminhões/motoristas excluídos OU pertencentes a empresa excluída → inativos.
  const caminhoes = db.caminhoes.map(c =>
    (camT.has(String(c.id)) || empT.has(String(c.empresaId))) ? { ...c, ativo: false } : c
  );
  const motoristas = db.motoristas.map(m =>
    (motT.has(String(m.id)) || empT.has(String(m.empresaId))) ? { ...m, ativo: false } : m
  );
  const rotas = rotT.size ? db.rotas.map(r => (rotT.has(String(r.id)) ? { ...r, ativo: false } : r)) : db.rotas;

  // Pais "mortos" cujas viagens devem cair em cascata.
  const deadCam = new Set(caminhoes.filter(c => c.ativo === false).map(c => String(c.id)));
  const deadMot = new Set(motoristas.filter(m => m.ativo === false).map(m => String(m.id)));
  const deadRot = new Set(rotas.filter(r => r.ativo === false).map(r => String(r.id)));

  const viagemRemovida = (v: { id: string; caminhaoId: string; motoristaId: string; rotaId: string }) =>
    vgmT.has(String(v.id)) ||
    deadCam.has(String(v.caminhaoId)) ||
    deadMot.has(String(v.motoristaId)) ||
    deadRot.has(String(v.rotaId));

  const viagensRemovidasIds = new Set(db.viagens.filter(viagemRemovida).map(v => String(v.id)));
  const viagens = db.viagens.filter(v => !viagensRemovidasIds.has(String(v.id)));

  return {
    ...db,
    empresas,
    caminhoes,
    motoristas,
    rotas,
    viagens,
    emissoes: db.emissoes.filter(e => !viagensRemovidasIds.has(String(e.viagemId))),
    alertas: db.alertas.filter(a => !a.viagemId || !viagensRemovidasIds.has(String(a.viagemId))),
  };
}
