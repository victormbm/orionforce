export type Role = "DPS" | "SUP" | "MDPS" | "TANK";

export interface GameClass {
  id: string;
  name: string;
  role: Role;
  /** Emoji usado no avatar enquanto não há sprite oficial. */
  emoji: string;
  /**
   * Caminho opcional de uma imagem da classe em /public.
   * Ex: "/classes/lord-knight.png". Se o arquivo existir, ele é usado
   * no lugar do emoji automaticamente.
   */
  img?: string;
}

/**
 * Classes do Ragnarok Origin Classic.
 * Para adicionar/alterar uma classe, basta editar esta lista.
 * Para usar a arte oficial, coloque o PNG em /public/classes/ e
 * preencha o campo `img` (ou siga o padrão /classes/<id>.png).
 */
export const CLASSES: GameClass[] = [
  { id: "assassin", name: "Assassin", role: "DPS", emoji: "🗡️" },
  { id: "biochemist-dps", name: "Biochemist (DPS)", role: "DPS", emoji: "⚗️" },
  { id: "biochemist-sup", name: "Biochemist (SUP)", role: "SUP", emoji: "🧪" },
  { id: "champion", name: "Champion", role: "DPS", emoji: "👊" },
  { id: "crossstalker", name: "CrossStalker", role: "DPS", emoji: "🎯" },
  { id: "gunslinger", name: "Gunslinger", role: "DPS", emoji: "🔫" },
  { id: "gypsy", name: "Gypsy", role: "SUP", emoji: "💃" },
  { id: "high-priest", name: "High Priest", role: "SUP", emoji: "✨" },
  { id: "high-wizard-dps", name: "High Wizard (DPS)", role: "DPS", emoji: "🔥" },
  { id: "high-wizard-sup", name: "High Wizard (SUP)", role: "SUP", emoji: "❄️" },
  { id: "lord-knight", name: "Lord Knight", role: "DPS", emoji: "⚔️" },
  { id: "mastersmith", name: "Mastersmith", role: "DPS", emoji: "🔨" },
  { id: "minstrel", name: "Minstrel", role: "SUP", emoji: "🎵" },
  { id: "paladin-dps", name: "Paladin (DPS)", role: "DPS", emoji: "🛡️" },
  { id: "paladin-sup", name: "Paladin (SUP)", role: "TANK", emoji: "🛡️" },
  { id: "professor-dps", name: "Professor (DPS)", role: "DPS", emoji: "📖" },
  { id: "professor-sup", name: "Professor (SUP)", role: "SUP", emoji: "📘" },
  { id: "sniper", name: "Sniper", role: "DPS", emoji: "🏹" },
  { id: "summoner", name: "Summoner (DPS Magic)", role: "MDPS", emoji: "🐱" },
  { id: "shinobi", name: "Shinobi", role: "DPS", emoji: "🥷" },
];

/** Cor de cada função (role) usada nos badges. */
export const ROLE_COLOR: Record<Role, string> = {
  DPS: "#e5484d",
  SUP: "#30a46c",
  MDPS: "#8e4ec6",
  TANK: "#2f6bff",
};

export function getClass(id: string): GameClass | undefined {
  return CLASSES.find((c) => c.id === id);
}
