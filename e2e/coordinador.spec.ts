import { test, expect } from '@playwright/test'
import { login, scanContraste, setTema, vigilarPayloads } from './helpers'
import { CREDENTIALS } from './credentials'

test.describe('COORDINADOR', () => {
  test('ve Secciones/Cohortes pero NO Seguridad; el panel es accesible', async ({ page }) => {
    const hallazgosPayload = vigilarPayloads(page)
    await login(page, CREDENTIALS.coordinador)

    await expect(page.getByRole('link', { name: 'Secciones' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Cohortes' })).toBeVisible()
    // Seguridad es solo SUPERADMIN/RECTOR (sidebar.tsx:61) — no debe aparecer.
    await expect(page.getByRole('link', { name: 'Seguridad' })).toHaveCount(0)
    // Personal Administrativo es solo SUPERADMIN/RECTOR (sidebar.tsx:52).
    await expect(page.getByRole('link', { name: 'Personal Administrativo' })).toHaveCount(0)

    await setTema(page, 'dark')
    expect(await scanContraste(page), 'Dashboard COORDINADOR, tema oscuro').toEqual([])

    await page.getByRole('link', { name: 'Secciones' }).click()
    await page.waitForURL('**/secciones')
    expect(await scanContraste(page), 'Secciones, tema oscuro').toEqual([])

    await page.getByRole('link', { name: 'Cohortes' }).click()
    await page.waitForURL('**/cohortes')
    expect(await scanContraste(page), 'Cohortes, tema oscuro').toEqual([])

    expect(hallazgosPayload, 'payloads con campos sensibles').toEqual([])
  })
})
