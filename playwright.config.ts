import { defineConfig, devices } from '@playwright/test'
import { API_URL } from './e2e/helpers'

// Corre contra el frontend servido localmente (npm run dev). El backend por
// defecto es el API local (puerto 3003), que usa la base `SIGU DB (dev)`; se
// puede apuntar a otro con E2E_API_URL (p. ej. el servicio `sigu-api-dev` de
// Render). Antes apuntaba a `sigu-api-prod` aunque este comentario decía
// "rama dev": las pruebas crean y modifican datos, así que nunca deben correr
// contra producción. No se usa el preview de Vercel porque tiene Deployment
// Protection (SSO) activo y generar un bypass automatizado debilita esa
// protección.
if (API_URL.includes('sigu-api-prod')) {
  throw new Error('Las pruebas e2e no deben correr contra el backend de producción.')
}
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
      VITE_API_URL: API_URL,
    },
  },
})
