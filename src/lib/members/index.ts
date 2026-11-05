import { trackRepository } from "@/lib/loading";
import { apiMembersRepo } from "./api";
import { localMembersRepo } from "./local";
import type { MembersRepository } from "./types";

/**
 * Ponto único de escolha do backend de dados.
 *
 *   NEXT_PUBLIC_DATA_BACKEND = "local"  -> localStorage (padrão, atual)
 *   NEXT_PUBLIC_DATA_BACKEND = "api"    -> API + banco do Vercel
 *
 * Quando o banco estiver pronto, basta mudar a variável no .env
 * (ou nas Environment Variables do Vercel). A tela não muda.
 */
const backend = process.env.NEXT_PUBLIC_DATA_BACKEND === "local" ? "local" : "api";

export const membersRepo: MembersRepository =
  trackRepository(backend === "api" ? apiMembersRepo : localMembersRepo);

export * from "./types";
