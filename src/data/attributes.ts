import type { Role } from "./classes";

/**
 * Schema dos atributos do personagem (Ragnarok Origin Classic).
 * Organizado em seções. Para adicionar/editar um atributo, mexa só aqui —
 * a tela de "Meu Personagem" é gerada a partir desta lista.
 */

export type AttrSection = "general" | "quasi" | "special";

export interface AttrField {
  id: string;
  label: string;
  /** Sufixo exibido (ex: "%"). Ausente = valor absoluto. */
  suffix?: string;
  section: AttrSection;
  /** Sempre obrigatório, para qualquer classe. */
  core?: boolean;
  /** Obrigatório apenas para estas funções. */
  requiredFor?: Role[];
}

export const ATTR_SECTIONS: {
  id: AttrSection;
  title: string;
  subtitle: string;
}[] = [
  {
    id: "general",
    title: "General Stats — Atributos gerais",
    subtitle: "Poder total, HP, Ataques e Defesas básicas",
  },
  {
    id: "quasi",
    title: "Quasi-Stats — Combate e resistências",
    subtitle: "Multiplicadores de dano %, Ignore Def e Crítico",
  },
  {
    id: "special",
    title: "Special — Modificadores especiais",
    subtitle: "PvP & modificadores raciais (Pequenos, Brutos, Médio, Demi-Human)",
  },
];

const PHYSICAL: Role[] = ["DPS", "TANK"];
const MAGIC: Role[] = ["MDPS", "SUP"];

export const ATTR_FIELDS: AttrField[] = [
  // ===== General =====
  { id: "poderGeral", label: "Poder Geral", section: "general", core: true },
  { id: "hpMax", label: "HP Máximo", section: "general", core: true },
  {
    id: "atk",
    label: "ATK (Ataque Físico)",
    section: "general",
    requiredFor: PHYSICAL,
  },
  {
    id: "matk",
    label: "MATK (Ataque Mágico)",
    section: "general",
    requiredFor: MAGIC,
  },
  { id: "pdef", label: "PDEF (Defesa Física)", section: "general", core: true },
  { id: "mdef", label: "MDEF (Defesa Mágica)", section: "general", core: true },

  // ===== Quasi-Stats =====
  { id: "aspd", label: "ASPD — Velocidade de ataque", suffix: "%", section: "quasi" },
  { id: "variableCT", label: "Variable CT — Conjuração variável", suffix: "%", section: "quasi" },
  { id: "fixedCT", label: "Fixed CT — Conjuração fixa", suffix: "%", section: "quasi" },
  { id: "healingDone", label: "Healing Done — Cura realizada", suffix: "%", section: "quasi" },
  { id: "healingTaken", label: "Healing Taken — Cura recebida", suffix: "%", section: "quasi" },
  { id: "critResistance", label: "CRIT Resistance", section: "quasi" },
  { id: "critDmgResistance", label: "CRIT DMG Resistance %", suffix: "%", section: "quasi" },
  { id: "pdmg", label: "PDMG % (Dano Físico %)", suffix: "%", section: "quasi", requiredFor: PHYSICAL },
  { id: "pdmgReduction", label: "PDMG Reduction %", suffix: "%", section: "quasi" },
  { id: "mdmg", label: "MDMG % (Dano Mágico %)", suffix: "%", section: "quasi", requiredFor: MAGIC },
  { id: "mdmgReduction", label: "MDMG Reduction %", suffix: "%", section: "quasi" },
  { id: "ignoreDef", label: "Ignore Def (Defesa Física Ignorada)", section: "quasi", requiredFor: PHYSICAL },
  { id: "ignoreDefPct", label: "Ignore DEF %", suffix: "%", section: "quasi" },
  { id: "ignoreMdef", label: "Ignore MDef (Defesa Mágica Ignorada)", section: "quasi", requiredFor: MAGIC },
  { id: "ignoreMdefPct", label: "Ignore MDEF %", suffix: "%", section: "quasi" },
  { id: "pvpDmgBonus", label: "PVP DMG Bonus", section: "quasi" },
  { id: "pvpDmgReduction", label: "PVP DMG Reduction", section: "quasi" },

  // ===== Special =====
  { id: "equipPatk", label: "Equipment PATK %", suffix: "%", section: "special" },
  { id: "equipMatk", label: "Equipment MATK %", suffix: "%", section: "special" },
  { id: "equipPdef", label: "Equipment PDEF %", suffix: "%", section: "special" },
  { id: "equipMdef", label: "Equipment MDEF %", suffix: "%", section: "special" },
  { id: "globalCd", label: "Global CD %", suffix: "%", section: "special" },
  { id: "dmgVsSmall", label: "Dano contra Pequenos %", suffix: "%", section: "special" },
  { id: "redVsSmall", label: "Redução contra Pequenos %", suffix: "%", section: "special" },
  { id: "dmgVsMedium", label: "DMG vs Medium %", suffix: "%", section: "special" },
  { id: "redVsMedium", label: "Reduction DMG vs Medium %", suffix: "%", section: "special" },
  { id: "dmgVsLarge", label: "Dano contra Brutos %", suffix: "%", section: "special" },
  { id: "redVsLarge", label: "Redução contra Brutos %", suffix: "%", section: "special" },
  { id: "dmgVsDemihuman", label: "DMG vs Demi-Human %", suffix: "%", section: "special" },
  { id: "redVsDemihuman", label: "Reduction DMG vs Demi-Human %", suffix: "%", section: "special" },
];

export function isRequired(field: AttrField, role?: Role): boolean {
  if (field.core) return true;
  return !!(role && field.requiredFor?.includes(role));
}
