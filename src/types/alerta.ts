import type { NivelAlerta } from './common';

export interface Alerta {
  id: string;
  tipo: string;
  descricao: string;
  nivel: NivelAlerta;
  dataGeracao: string;
  empresaId: string;
  empresa?: string;
  /** Campo local/front-only para relacionar alertas automáticos mockados à viagem. */
  viagemId?: string;
  lido?: boolean;
  resolvido?: boolean;
}
