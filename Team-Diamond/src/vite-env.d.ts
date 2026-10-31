/// <reference types="vite/client" />

// Typed environment variables. Both are required (see .env.example).
interface ImportMetaEnv {
  /** Base URL of the API including /api/v1, e.g. http://localhost:4000/api/v1 */
  readonly VITE_API_URL: string;
  /** "true" starts the MSW mock API (M2-T2). Must be "false" on Vercel. */
  readonly VITE_USE_MOCKS: "true" | "false";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}