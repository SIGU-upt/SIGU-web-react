import { test, expect } from '@playwright/test'
import { intentarLoginWeb } from './helpers'
import { CREDENTIALS } from './credentials'

// Hallazgo real de la primera corrida: un DOCENTE NO puede entrar al panel
// web en absoluto — ADR-020 (SIGU-api-nest/src/modules/auth/auth.service.ts:15-17)
// reserva el panel web a SUPERADMIN/RECTOR/AUDITOR/COORDINADOR; DOCENTE/ALUMNO
// solo entran por la app móvil (clientType: APP). El backend ya da un mensaje
// claro y accionable, así que lo que se prueba aquí es que ese rechazo sigue
// funcionando, no un flujo de panel que el rol nunca puede alcanzar.
test.describe('DOCENTE', () => {
  test('el panel web lo rechaza con un mensaje claro, no un error genérico', async ({ page }) => {
    await intentarLoginWeb(page, CREDENTIALS.docente)
    await expect(
      page.locator('form').getByText(/no tiene acceso a este panel.*aplicación móvil/i),
    ).toBeVisible()
    // No debe haber quedado "medio autenticado": sin token, sin acceso a /dashboard.
    const token = await page.evaluate(() => localStorage.getItem('sigu_token'))
    expect(token).toBeNull()
  })
})
