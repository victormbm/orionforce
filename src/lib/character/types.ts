/**
 * Ficha de personagem (atributos) + snapshots de evolução.
 * Separado do repositório de membros (auth) de propósito — é outra tabela
 * no banco e outra responsabilidade.
 */

export type Attributes = Record<string, number>;

export interface CharacterSheet {
  memberId: string;
  attributes: Attributes;
  updatedAt: string;
}

export interface Snapshot {
  id: string;
  createdAt: string;
  attributes: Attributes;
}

/** Resumo leve por membro, para alimentar o roster/dashboard. */
export interface CharacterSummary {
  poder: number;
  hp: number;
}

export interface CharacterRepository {
  get(memberId: string): Promise<CharacterSheet | null>;
  save(memberId: string, attributes: Attributes): Promise<CharacterSheet>;
  listSnapshots(memberId: string): Promise<Snapshot[]>;
  /** Tira um snapshot do que está salvo agora. */
  addSnapshot(memberId: string): Promise<Snapshot>;
  deleteSnapshot(memberId: string, snapshotId: string): Promise<void>;
  /** Mapa memberId -> resumo (poder/hp) para o roster. */
  summaries(): Promise<Record<string, CharacterSummary>>;
}
