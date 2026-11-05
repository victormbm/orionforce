import { apiFetch } from "@/lib/http";
import type { GvgAssignments, GvgRepository } from "./types";

export const apiGvgRepo: GvgRepository = {
  getAssignments: () => apiFetch<GvgAssignments>("/api/gvg"),
  assign: async (memberId, target) => {
    await apiFetch("/api/gvg", {
      method: "PUT",
      body: JSON.stringify({ memberId, group: target?.group ?? null, party: target?.party }),
    });
  },
  clear: async (target) => {
    await apiFetch("/api/gvg", { method: "DELETE", body: JSON.stringify(target) });
  },
};
