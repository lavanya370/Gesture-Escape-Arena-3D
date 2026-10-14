import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(() => {
  const isHttps =
    process.env.HTTPS === 'true' ||
    process.env.npm_lifecycle_event === 'dev:https' ||
    process.argv.includes('--https')

  return {
    plugins: [react(), isHttps ? basicSsl() : undefined].filter(Boolean),
    server: {
      host: '0.0.0.0',
    },
  }
})
