import { defineConfig, devices } from '@playwright/test'

// Corre contra el frontend servido localmente (npm run dev), apuntando al
// backend REAL de la rama dev en Render (ver e2e/credentials.ts). No se usa
// el preview de Vercel porque tiene Deployment Protection (SSO) activo y
// generar un bypass automatizado debilita esa protección — correr el mismo
// código localmente, contra el mismo backend real, prueba exactamente lo
// mismo sin tocar esa configuración.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [['html', { open: 'never' }]],
  timeout: 120_000,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 30_000,
    env: {
      VITE_API_URL: 'https://sigu-api-prod.onrender.com/api/v1',
    },
  },
})
