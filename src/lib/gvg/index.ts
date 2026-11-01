import { apiGvgRepo } from "./api";
import { localGvgRepo } from "./local";
import type { GvgRepository } from "./types";

const backend = process.env.NEXT_PUBLIC_DATA_BACKEND ?? "local";

export const gvgRepo: GvgRepository =
  backend === "api" ? apiGvgRepo : localGvgRepo;

export * from "./types";
