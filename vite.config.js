import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { execSync } from 'node:child_process'

// PROBE:DEPLOY_BUILD_ID_V1:START
let DEPLOY_GIT_SHA = 'unknown';
try {
  DEPLOY_GIT_SHA = execSync('git rev-parse --short HEAD').toString().trim();
} catch {
  DEPLOY_GIT_SHA = 'unknown';
}
const DEPLOY_BUILD_TIME = new Date().toISOString();
// PROBE:DEPLOY_BUILD_ID_V1:END

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // In dev we must use base "/" because the Vite dev server already serves at root.
  // If we also set base to "/Immanence/" in dev, some asset and script URLs are
  // generated with a double base (e.g. "/Immanence/src/main.jsx"). Those requests
 // then fall back to index.html and are served as text/html instead of JS/CSS,
 // causing browser errors like "Refused to execute script ... MIME type 'text/html'".
 // To avoid these MIME-type issues we keep base "/" for development and only use
 // "/Immanence/" for build/preview so deployed assets resolve under that sub-path.
 base: mode === 'development' ? '/' : '/Immanence/',
  // PROBE:DEPLOY_BUILD_ID_V1:START
  define: {
    __DEPLOY_GIT_SHA__: JSON.stringify(DEPLOY_GIT_SHA),
    __DEPLOY_BUILD_TIME__: JSON.stringify(DEPLOY_BUILD_TIME),
  },
    // PROBE:DEPLOY_BUILD_ID_V1:END
}))
