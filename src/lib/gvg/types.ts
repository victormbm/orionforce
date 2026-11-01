/** Escalação de GvG (guerra do clã): divisão em grupos Elite e Secundária. */

export type GvgGroup = "elite" | "secundaria";

export interface GvgRepository {
  /** memberId -> grupo. Membros ausentes estão "disponíveis". */
  getAssignments(): Promise<Record<string, GvgGroup>>;
  /** Define o grupo de um membro; null = volta para disponíveis. */
  assign(memberId: string, group: GvgGroup | null): Promise<void>;
  /** Limpa toda a escalação. */
  clear(): Promise<void>;
}
