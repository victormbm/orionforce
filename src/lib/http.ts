import { getToken } from "@/lib/token";

/** Fetch JSON genérico para as implementações de repositório via API. */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new Error("Falha de conexão. Tente novamente.");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg =
      data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : "Erro inesperado.";
    throw new Error(msg);
  }
  return data as T;
}
