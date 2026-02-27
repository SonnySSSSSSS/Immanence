import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

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
  // PROBE:DEPLOY_ID_DEFINE:START
  define: {
    __DEPLOY_GIT_SHA__: JSON.stringify(process.env.GITHUB_SHA || '__DEPLOY_GIT_SHA__'),
    __DEPLOY_GIT_REF__: JSON.stringify(process.env.GITHUB_REF_NAME || process.env.GITHUB_REF || '__DEPLOY_GIT_REF__'),
    __DEPLOY_BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  // PROBE:DEPLOY_ID_DEFINE:END
 server: {
    proxy: {
      '/api/ollama': {
        target: 'http://localhost:11434',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ollama/, '')
      }
    }
  }
}))
