import { apiFetch } from "@/lib/http";
import type {
  Attributes,
  CharacterRepository,
  CharacterSheet,
  CharacterSummary,
  Snapshot,
} from "./types";

/** Implementação via API (Neon) da ficha de personagem. */
export const apiCharacterRepo: CharacterRepository = {
  get: (memberId) =>
    apiFetch<CharacterSheet | null>(`/api/character/${memberId}`),

  save: (memberId, attributes: Attributes) =>
    apiFetch<CharacterSheet>(`/api/character/${memberId}`, {
      method: "PUT",
      body: JSON.stringify({ attributes }),
    }),

  listSnapshots: (memberId) =>
    apiFetch<Snapshot[]>(`/api/character/${memberId}/snapshots`),

  addSnapshot: (memberId) =>
    apiFetch<Snapshot>(`/api/character/${memberId}/snapshots`, {
      method: "POST",
    }),

  deleteSnapshot: async (memberId, snapshotId) => {
    await apiFetch(`/api/character/${memberId}/snapshots/${snapshotId}`, {
      method: "DELETE",
    });
  },

  summaries: () =>
    apiFetch<Record<string, CharacterSummary>>(`/api/character/summaries`),
};
