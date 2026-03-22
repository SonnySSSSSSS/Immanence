import { runtimeEnv } from "../config/runtimeEnv.js";

const isProduction = runtimeEnv.isProd;

function formatArgs(scope, args) {
  return [`[${scope}]`, ...args];
}

export function createLogger(scope) {
  return {
    debug: (...args) => {
      if (!isProduction) {
        console.debug(...formatArgs(scope, args));
      }
    },
    info: (...args) => {
      if (!isProduction) {
        console.info(...formatArgs(scope, args));
      }
    },
    warn: (...args) => {
      console.warn(...formatArgs(scope, args));
    },
    error: (...args) => {
      console.error(...formatArgs(scope, args));
    },
  };
}