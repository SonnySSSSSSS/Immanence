import { RuntimeFailureCode, createRuntimeFailure } from "../utils/runtimeFailure.js";
import {
  getAuthModeCheck,
  getStartupRuntimeCheck,
} from "../utils/runtimeChecks.js";

const TRUE_VALUES = new Set(["true"]);
const FALSE_VALUES = new Set(["false"]);

interface RuntimeEnv {
  supabaseUrl: string;
  supabaseAnonKey: string;
  enableAuth: boolean;
  isDev: boolean;
  isProd: boolean;
  baseUrl: string;
}

interface AuthRuntimeMode {
  enabled: boolean;
  mode: 'enabled' | 'disabled';
}

function readEnvString(name: string): string {
  const value = (import.meta as any).env[name];
  return typeof value === "string" ? value.trim() : "";
}

function readEnvBoolean(name: string, fallback: boolean = false): boolean {
  const value = (import.meta as any).env[name];
  return typeof value === "boolean" ? value : fallback;
}

function parseEnableAuth(): boolean {
  const rawValue = readEnvString("VITE_ENABLE_AUTH").toLowerCase();
  if (TRUE_VALUES.has(rawValue)) return true;
  if (FALSE_VALUES.has(rawValue)) return false;
  return true;
}

function createAuthEnvError(missingNames: string[]): Error {
  return createRuntimeFailure(null, {
    code: RuntimeFailureCode.RUNTIME_CONFIG_MISSING,
    category: "startup",
    message:
      `Missing required runtime environment variables for auth-enabled startup: ${missingNames.join(", ")}. ` +
      "Set them in your local environment or disable auth explicitly with VITE_ENABLE_AUTH=false.",
    details: { missingNames },
  });
}

export const runtimeEnv: RuntimeEnv = {
  supabaseUrl: readEnvString("VITE_SUPABASE_URL"),
  supabaseAnonKey: readEnvString("VITE_SUPABASE_ANON_KEY"),
  enableAuth: parseEnableAuth(),
  isDev: readEnvBoolean("DEV"),
  isProd: readEnvBoolean("PROD"),
  baseUrl: readEnvString("BASE_URL") || "/",
};

export function getAuthRuntimeMode(): AuthRuntimeMode {
  return getAuthModeCheck(runtimeEnv);
}

export function getStartupRuntimeVerification() {
  return getStartupRuntimeCheck(runtimeEnv, getMissingAuthEnvNames());
}

export function getMissingAuthEnvNames(): string[] {
  if (!runtimeEnv.enableAuth) return [];

  const missingNames: string[] = [];
  if (!runtimeEnv.supabaseUrl) missingNames.push("VITE_SUPABASE_URL");
  if (!runtimeEnv.supabaseAnonKey) missingNames.push("VITE_SUPABASE_ANON_KEY");
  return missingNames;
}

export function validateStartupRuntimeEnv(): void {
  const missingNames = getMissingAuthEnvNames();
  if (missingNames.length > 0) {
    throw createAuthEnvError(missingNames);
  }
}

export function assertAuthRuntimeEnvConfigured(): void {
  const missingNames = getMissingAuthEnvNames();
  if (missingNames.length > 0) {
    throw createAuthEnvError(missingNames);
  }
}
