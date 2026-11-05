/** Formula supplied in the guild's reference screenshots; not a damage-reduction formula. */
export function calculateRawDefense(equipment: number, bonusPercent: number, ignore?: number) {
  if (![equipment, bonusPercent, ...(ignore === undefined ? [] : [ignore])].every(value => Number.isFinite(value) && value >= 0)) {
    throw new Error("Use apenas números positivos ou zero.");
  }
  const multiplier = 1 + bonusPercent / 100;
  const raw = equipment / multiplier;
  return { raw, multiplier, gap: ignore === undefined ? null : raw - ignore };
}

export function parseDefenseInput(text: string, percentage = false): number | null {
  const normalized = (percentage ? text.trim().replace(/%$/, "").trim() : text.trim()).replace(",", ".");
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export type DefenseInputs = { equipment: string; bonus: string; ignore: string };
export type CalculatorInputs = { physical: DefenseInputs; magical: DefenseInputs };
export const EMPTY_CALCULATOR: CalculatorInputs = {
  physical: { equipment: "", bonus: "", ignore: "" },
  magical: { equipment: "", bonus: "", ignore: "" },
};
export function restoreCalculator(value: unknown): CalculatorInputs {
  const restored = structuredClone(EMPTY_CALCULATOR);
  if (!value || typeof value !== "object") return restored;
  for (const type of ["physical", "magical"] as const) {
    const fields = (value as Record<string, unknown>)[type];
    if (!fields || typeof fields !== "object") continue;
    for (const field of ["equipment", "bonus", "ignore"] as const) {
      const text = (fields as Record<string, unknown>)[field];
      if (typeof text === "string" && text.length <= 100) restored[type][field] = text;
    }
  }
  return restored;
}
