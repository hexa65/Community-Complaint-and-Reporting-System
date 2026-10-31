// The only place in the web app that calls fetch. Every feature goes through apiFetch,
// so base URL, auth header and error handling are written exactly once.

/** localStorage key for the JWT (locked in the project decisions). M2-T4 manages it. */
export const TOKEN_STORAGE_KEY = "civictrack_token";

export interface ApiErrorDetail {
  path: string;
  message: string;
}

/** Every failure (server error, network failure, unreadable response) becomes one of these. */
export class ApiError extends Error {
  /** HTTP status, or 0 when the server could not be reached. */
  readonly status: number;
  /** Code from the API contract, e.g. "VALIDATION_ERROR", or "NETWORK_ERROR" (client only). */
  readonly code: string;
  readonly details?: ApiErrorDetail[];

  constructor(status: number, code: string, message: string, details?: ApiErrorDetail[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export interface ApiFetchOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  /** Sent as JSON. */
  body?: unknown;
  /** Added to the URL. undefined, null and "" values are skipped. */
  query?: Record<string, string | number | boolean | null | undefined>;
  /** Pass TanStack Query's signal so cancelled queries cancel the request. */
  signal?: AbortSignal;
}

// Same shape as PaginationMeta in the shared contract. Declared here because
// M1-T2 (the contract copy) depends on this task, so @/shared does not exist yet.
export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Page<T> {
  data: T[];
  meta: PageMeta;
}

const NETWORK_MESSAGE =
  "Can't reach the server. It may be waking up, so wait a few seconds and try again.";
const UNEXPECTED_MESSAGE = "The server sent an unexpected response. Please try again.";

function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    // Storage can be blocked (private mode, strict settings). Treat that as "logged out".
    return null;
  }
}

function buildUrl(path: string, query: ApiFetchOptions["query"]): string {
  const baseUrl = import.meta.env.VITE_API_URL;
  if (!baseUrl) {
    throw new Error("VITE_API_URL is not set. Copy .env.example to .env and restart the dev server.");
  }

  const url = `${baseUrl.replace(/\/+$/, "")}${path.startsWith("/") ? path : `/${path}`}`;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }
  const queryString = params.toString();
  return queryString ? `${url}?${queryString}` : url;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseErrorBody(body: unknown): { code: string; message: string; details?: ApiErrorDetail[] } | null {
  if (!isRecord(body) || !isRecord(body.error)) return null;
  const { code, message, details } = body.error;
  if (typeof code !== "string" || typeof message !== "string") return null;
  return { code, message, details: Array.isArray(details) ? (details as ApiErrorDetail[]) : undefined };
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    // E.g. an HTML error page from a proxy while the API is starting.
    return undefined;
  }
}

async function request(path: string, options: ApiFetchOptions): Promise<{ status: number; body: unknown }> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body !== undefined) headers["Content-Type"] = "application/json";

  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });
  } catch (error) {
    // A cancelled request is not a failure. Let TanStack Query handle it.
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(0, "NETWORK_ERROR", NETWORK_MESSAGE);
  }

  const body = await readJson(response);

  if (!response.ok) {
    const parsed = parseErrorBody(body);
    if (parsed) throw new ApiError(response.status, parsed.code, parsed.message, parsed.details);
    throw new ApiError(
      response.status,
      response.status >= 500 ? "INTERNAL_ERROR" : "UNKNOWN_ERROR",
      UNEXPECTED_MESSAGE,
    );
  }

  return { status: response.status, body };
}

/** Calls the API and returns the `data` field of `{ data }` responses. */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { status, body } = await request(path, options);

  if (status === 204) return undefined as T;
  if (!isRecord(body) || !("data" in body)) {
    throw new ApiError(status, "INTERNAL_ERROR", UNEXPECTED_MESSAGE);
  }
  return body.data as T;
}

/** Same as apiFetch, for paginated routes: returns `{ data, meta }`. */
export async function apiFetchPage<T>(path: string, options: ApiFetchOptions = {}): Promise<Page<T>> {
  const { status, body } = await request(path, options);

  if (!isRecord(body) || !Array.isArray(body.data) || !isRecord(body.meta)) {
    throw new ApiError(status, "INTERNAL_ERROR", UNEXPECTED_MESSAGE);
  }
  return { data: body.data as T[], meta: body.meta as unknown as PageMeta };
}