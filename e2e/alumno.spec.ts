import { test, expect } from '@playwright/test'
import { intentarLoginWeb } from './helpers'
import { CREDENTIALS } from './credentials'

// Mismo hallazgo que en docente.spec.ts: un ALUMNO solo entra por la app
// móvil (ADR-020) — el panel web nunca le muestra un Dashboard que probar.
test.describe('ALUMNO', () => {
  test('el panel web lo rechaza con un mensaje claro, no un error genérico', async ({ page }) => {
    await intentarLoginWeb(page, CREDENTIALS.alumno)
    await expect(
      page.locator('form').getByText(/no tiene acceso a este panel.*aplicación móvil/i),
    ).toBeVisible()
    const token = await page.evaluate(() => localStorage.getItem('sigu_token'))
    expect(token).toBeNull()
  })
})
