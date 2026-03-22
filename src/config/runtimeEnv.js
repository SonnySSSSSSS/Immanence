const TRUE_VALUES = new Set(["true"]);
const FALSE_VALUES = new Set(["false"]);

function readEnvString(name) {
  const value = import.meta.env[name];
  return typeof value === "string" ? value.trim() : "";
}

function parseEnableAuth() {
  const rawValue = readEnvString("VITE_ENABLE_AUTH").toLowerCase();
  if (TRUE_VALUES.has(rawValue)) return true;
  if (FALSE_VALUES.has(rawValue)) return false;
  return true;
}

function createAuthEnvError(missingNames) {
  return new Error(
    `Missing required runtime environment variables for auth-enabled startup: ${missingNames.join(", ")}. ` +
      "Set them in your local environment or disable auth explicitly with VITE_ENABLE_AUTH=false."
  );
}

export const runtimeEnv = {
  supabaseUrl: readEnvString("VITE_SUPABASE_URL"),
  supabaseAnonKey: readEnvString("VITE_SUPABASE_ANON_KEY"),
  enableAuth: parseEnableAuth(),
  llmProxyUrl: readEnvString("VITE_LLM_PROXY_URL"),
};

export function getMissingAuthEnvNames() {
  if (!runtimeEnv.enableAuth) return [];

  const missingNames = [];
  if (!runtimeEnv.supabaseUrl) missingNames.push("VITE_SUPABASE_URL");
  if (!runtimeEnv.supabaseAnonKey) missingNames.push("VITE_SUPABASE_ANON_KEY");
  return missingNames;
}

export function validateStartupRuntimeEnv() {
  const missingNames = getMissingAuthEnvNames();
  if (missingNames.length > 0) {
    throw createAuthEnvError(missingNames);
  }
}

export function assertAuthRuntimeEnvConfigured() {
  const missingNames = getMissingAuthEnvNames();
  if (missingNames.length > 0) {
    throw createAuthEnvError(missingNames);
  }
}

export function requireLlmProxyUrl() {
  if (!runtimeEnv.llmProxyUrl) {
    throw new Error(
      "Missing required runtime environment variable VITE_LLM_PROXY_URL for LLM calls. Configure it before invoking Four Modes validation."
    );
  }

  return runtimeEnv.llmProxyUrl;
}