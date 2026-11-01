import { apiFetch } from "@/lib/http";
import type { GvgGroup, GvgRepository } from "./types";

/** Implementação via API (Neon) da escalação de GvG. */
export const apiGvgRepo: GvgRepository = {
  getAssignments: () =>
    apiFetch<Record<string, GvgGroup>>("/api/gvg"),

  assign: async (memberId, group) => {
    await apiFetch("/api/gvg", {
      method: "PUT",
      body: JSON.stringify({ memberId, group }),
    });
  },

  clear: async () => {
    await apiFetch("/api/gvg", { method: "DELETE" });
  },
};
