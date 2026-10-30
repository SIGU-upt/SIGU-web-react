import { type Page, type APIResponse, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

interface Credential {
  ci: string
  password: string
}

/** Login real por formulario (no inyectando el token) — así se prueba el flujo completo. */
export async function login(page: Page, { ci, password }: Credential, destino = 'dashboard') {
  const [prefix, digits] = ci.split('-')
  await page.goto('/login')
  await page.getByRole('combobox', { name: 'Nacionalidad' }).click()
  await page.getByRole('option', { name: new RegExp(`^${prefix}-`) }).click()
  await page.locator('#ci').fill(digits)
  await page.locator('#password').fill(password)
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
  // `destino`: a dónde cae el rol al entrar (el DOCENTE no tiene Dashboard y aterriza en Reportes).
  await page.waitForURL(`**/${destino}`, { timeout: 90_000 }) // Render free tier: cold start
}

/** Intenta login esperando que lo RECHACE (para ALUMNO, que solo entra por la app — ADR-020). */
export async function intentarLoginWeb(page: Page, { ci, password }: Credential) {
  const [prefix, digits] = ci.split('-')
  await page.goto('/login')
  await page.getByRole('combobox', { name: 'Nacionalidad' }).click()
  await page.getByRole('option', { name: new RegExp(`^${prefix}-`) }).click()
  await page.locator('#ci').fill(digits)
  await page.locator('#password').fill(password)
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
}

/** Corre axe-core en el tema actual y devuelve solo violaciones serias/críticas de contraste. */
export async function scanContraste(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2aa'])
    .include('body')
    .analyze()
  return results.violations.filter(
    (v) => v.id === 'color-contrast' && (v.impact === 'serious' || v.impact === 'critical'),
  )
}

export async function setTema(page: Page, tema: 'light' | 'dark') {
  await page.evaluate((t) => localStorage.setItem('theme', t), tema)
  await page.reload()
}

/** Revisa que ninguna respuesta JSON de /api/v1 traiga campos que nunca deberían salir al cliente. */
const CAMPOS_PROHIBIDOS = ['password', 'passwordHash', 'encrypted_password', 'resetToken', 'confirmationToken']

export function vigilarPayloads(page: Page) {
  const hallazgos: string[] = []
  page.on('response', async (res) => {
    if (!res.url().includes('/api/v1')) return
    const ct = res.headers()['content-type'] ?? ''
    if (!ct.includes('application/json')) return
    try {
      const body = await res.json()
      const texto = JSON.stringify(body)
      for (const campo of CAMPOS_PROHIBIDOS) {
        if (texto.includes(`"${campo}"`)) {
          hallazgos.push(`${res.url()} incluye el campo "${campo}"`)
        }
      }
    } catch {
      // respuesta no-JSON parseable (ej. archivo exportado) — no aplica
    }
  })
  return hallazgos
}

export async function esperar200(res: APIResponse | null, contexto: string) {
  expect(res?.ok(), `${contexto}: esperaba 2xx, dio ${res?.status()}`).toBeTruthy()
}
