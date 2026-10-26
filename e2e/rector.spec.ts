import { test, expect } from '@playwright/test'
import { login, scanContraste, setTema, vigilarPayloads } from './helpers'
import { CREDENTIALS } from './credentials'

test.describe('RECTOR', () => {
  test('ve su sede, Personal Administrativo y Seguridad; el panel es accesible', async ({ page }) => {
    const hallazgosPayload = vigilarPayloads(page)
    await login(page, CREDENTIALS.rector)

    await expect(page.getByRole('link', { name: 'Personal Administrativo' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Seguridad' })).toBeVisible()

    await setTema(page, 'dark')
    expect(await scanContraste(page), 'Dashboard RECTOR, tema oscuro').toEqual([])

    await page.getByRole('link', { name: 'Personal Administrativo' }).click()
    await page.waitForURL('**/personal-administrativo')
    expect(await scanContraste(page), 'Personal Administrativo, tema oscuro').toEqual([])

    expect(hallazgosPayload, 'payloads con campos sensibles').toEqual([])
  })

  test('no puede leer una sede inexistente/ajena vía API directa (jurisdicción)', async ({ page }) => {
    await login(page, CREDENTIALS.rector)
    const token = await page.evaluate(() => localStorage.getItem('sigu_token'))
    // Un id que no existe/no es el suyo — el backend debe responder 403/404,
    // nunca 200 con datos reales (JurisdictionService.assertJurisdiccionSobreSede).
    const res = await page.request.get(
      'https://sigu-api-prod.onrender.com/api/v1/sedes/00000000-0000-0000-0000-000000000000',
      { headers: { Authorization: `Bearer ${token}` }, failOnStatusCode: false },
    )
    expect([403, 404]).toContain(res.status())
  })
})
