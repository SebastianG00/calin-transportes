import { supabase } from "./supabase"

const API_URL = import.meta.env.VITE_API_URL ?? ""

export class ApiError extends Error {
  status: number
  code: string
  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
  }
}

/** Fetch the Express API with the current Supabase session JWT attached. */
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const text = await res.text()
  const body = text ? JSON.parse(text) : null
  if (!res.ok) {
    throw new ApiError(
      res.status,
      body?.code ?? "UNKNOWN",
      body?.message ?? "Error de red.",
    )
  }
  return body as T
}
