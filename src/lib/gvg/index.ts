import { trackRepository } from "@/lib/loading";
import { apiGvgRepo } from "./api";
import { localGvgRepo } from "./local";
import type { GvgRepository } from "./types";

const backend = process.env.NEXT_PUBLIC_DATA_BACKEND === "local" ? "local" : "api";

export const gvgRepo: GvgRepository =
  trackRepository(backend === "api" ? apiGvgRepo : localGvgRepo);

export * from "./types";
