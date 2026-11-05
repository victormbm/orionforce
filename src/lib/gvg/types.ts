/** Each GvG team has eight parties, with five members in each party. */
export type GvgGroup = "elite" | "secundaria";
export type GvgAssignment = { group: GvgGroup; party: number };
export type GvgAssignments = Record<string, GvgAssignment>;

export interface GvgRepository {
  getAssignments(): Promise<GvgAssignments>;
  assign(memberId: string, target: GvgAssignment | null): Promise<void>;
  clear(target: GvgAssignment): Promise<void>;
}
