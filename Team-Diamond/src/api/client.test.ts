import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch, apiFetchPage, ApiError, TOKEN_STORAGE_KEY } from "@/api/client";

const BASE_URL = "http://localhost:4000/api/v1";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubEnv("VITE_API_URL", `${BASE_URL}/`); // trailing slash on purpose
  vi.stubGlobal("fetch", fetchMock);
  localStorage.clear();
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("apiFetch", () => {
  it("returns the data field and builds the URL with a query string", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: [{ id: 1, name: "Other", slug: "other" }] }));

    const result = await apiFetch<{ id: number }[]>("/categories", {
      query: { status: "PENDING", q: undefined, page: 2 },
    });

    expect(result).toEqual([{ id: 1, name: "Other", slug: "other" }]);
    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE_URL}/categories?status=PENDING&page=2`,
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("sends the bearer token and a JSON body when present", async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, "abc123");
    fetchMock.mockResolvedValue(jsonResponse({ data: { ok: true } }, 201));

    await apiFetch("/complaints", { method: "POST", body: { title: "Broken light" } });

    const init = fetchMock.mock.calls[0]?.[1];
    expect(init?.headers).toMatchObject({
      Authorization: "Bearer abc123",
      "Content-Type": "application/json",
    });
    expect(init?.body).toBe(JSON.stringify({ title: "Broken light" }));
  });

  it("throws ApiError with code and details for the standard error shape", async () => {
    const details = [{ path: "title", message: "Title must be at least 5 characters" }];
    fetchMock.mockResolvedValue(
      jsonResponse({ error: { code: "VALIDATION_ERROR", message: "Invalid request body", details } }, 400),
    );

    const error = await apiFetch("/complaints", { method: "POST", body: {} }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, code: "VALIDATION_ERROR", details });
  });

  it("throws ApiError NETWORK_ERROR when the server cannot be reached", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const error = await apiFetch("/categories").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 0, code: "NETWORK_ERROR" });
  });

  it("throws ApiError INTERNAL_ERROR when a 5xx response is not JSON", async () => {
    fetchMock.mockResolvedValue(new Response("<html>Bad gateway</html>", { status: 502 }));

    const error = await apiFetch("/categories").catch((e: unknown) => e);

    expect(error).toMatchObject({ status: 502, code: "INTERNAL_ERROR" });
  });
});

describe("apiFetchPage", () => {
  it("returns data and meta", async () => {
    const meta = { page: 1, pageSize: 10, total: 1, totalPages: 1 };
    fetchMock.mockResolvedValue(jsonResponse({ data: [{ id: "c1" }], meta }));

    const result = await apiFetchPage<{ id: string }>("/complaints/mine");

    expect(result).toEqual({ data: [{ id: "c1" }], meta });
  });
});