import { test, expect } from '@playwright/test'
import { login } from './helpers'
import { CREDENTIALS } from './credentials'

// Fase 9 (3/11/2026): "probar con internet lento" — no reproduce un corte
// real (eso ya está documentado y sin resolver para el guardado offline del
// ALUMNO, ver docs/AUDITORIA_NOV2026.md), pero sí confirma que las pantallas
// con más peticiones no se rompen ni quedan en un spinner infinito cuando
// cada respuesta de la API tarda varios segundos — solo se retrasan.
test.describe('Red lenta', () => {
  test('Secciones con latencia agregada a cada respuesta de la API sigue cargando', async ({ page }) => {
    await page.route('**/api/v1/**', async (route) => {
      await new Promise((r) => setTimeout(r, 1500))
      await route.continue()
    })

    await login(page, CREDENTIALS.coordinador)
    await page.getByRole('link', { name: 'Secciones' }).click()
    // Con la latencia agregada, dar más margen que el timeout por defecto.
    await page.waitForURL('**/secciones', { timeout: 30_000 })
    await expect(page.getByText('Cargando...')).toHaveCount(0, { timeout: 30_000 })
    // La pantalla terminó de cargar algo (la tabla o su estado vacío), no se
    // quedó en blanco ni mostró un error genérico por la latencia.
    await expect(page.getByText(/error de conexión/i)).toHaveCount(0)
  })
})
