import { test, expect } from '@playwright/test'
import { login, scanContraste, setTema, vigilarPayloads } from './helpers'
import { CREDENTIALS } from './credentials'

test.describe('SUPERADMIN', () => {
  test('entra, ve seguridad y el panel es accesible en ambos temas', async ({ page }) => {
    const hallazgosPayload = vigilarPayloads(page)
    await login(page, CREDENTIALS.superadmin)

    // Un SUPERADMIN ve todo el menú, incluida Seguridad (ADR-002/PERMISOS.md).
    await expect(page.getByRole('link', { name: 'Seguridad' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Configuración' })).toBeVisible()

    await setTema(page, 'light')
    expect(await scanContraste(page), 'Dashboard, tema claro').toEqual([])
    await setTema(page, 'dark')
    expect(await scanContraste(page), 'Dashboard, tema oscuro').toEqual([])

    await page.getByRole('link', { name: 'Seguridad' }).click()
    await page.waitForURL('**/security-logs')
    expect(await scanContraste(page), 'Logs de seguridad, tema oscuro').toEqual([])

    expect(hallazgosPayload, 'payloads con campos sensibles').toEqual([])
  })

  // Fase 6 (3/11/2026): catálogo de materias dentro del detalle de un PNF.
  test('el detalle de un PNF muestra el catálogo de materias', async ({ page }) => {
    await login(page, CREDENTIALS.superadmin)
    await page.getByRole('link', { name: 'Configuración' }).click()
    await page.waitForURL('**/configuracion')
    await page.getByRole('tab', { name: 'PNFs' }).click()

    const primeraFila = page.locator('tbody tr').first()
    await expect(primeraFila).toBeVisible({ timeout: 15_000 })
    await primeraFila.click()
    await page.waitForURL('**/pnfs/*', { timeout: 15_000 })

    await expect(page.getByText(/Catálogo de materias/)).toBeVisible({ timeout: 15_000 })
    expect(await scanContraste(page), 'Detalle de PNF, tema claro').toEqual([])
  })
})
