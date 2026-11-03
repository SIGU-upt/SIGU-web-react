import { type Page, type APIResponse, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

interface Credential {
  ci: string
  password: string
}

/** Login real por formulario (no inyectando el token) — así se prueba el flujo completo. */
export async function login(page: Page, { ci, password }: Credential, destino = 'dashboard') {
  await desactivarTourAutomatico(page)
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

/**
 * Cada browser context de Playwright arranca con localStorage vacío, así que el tour de
 * onboarding (driver.js) se auto-inicia en el primer login y en la primera visita a cada
 * pantalla (`useOnboardingTour`) — su overlay cubre todo el viewport e intercepta los clicks
 * de los pasos siguientes del test. Escribir el flag "no mostrar automáticamente" recién
 * DESPUÉS de que la navegación a destino resuelve llega tarde: ese `useState` ya se inicializó
 * leyendo localStorage en el primer render del dashboard, antes de que la escritura llegara —
 * una carrera que a veces se ganaba y a veces no (de ahí la falla intermitente). `addInitScript`
 * corre antes que cualquier script de la página, en toda navegación de este contexto, así que
 * parchea `localStorage.setItem` para que el flag quede puesto en el mismo tick síncrono en que
 * la app real escribe `sigu_user` — antes de que el router navegue al destino y el dashboard
 * monte por primera vez.
 */
async function desactivarTourAutomatico(page: Page) {
  await page.addInitScript(() => {
    // `.call(this, ...)`, no una versión pre-atada a `localStorage`: `Storage.prototype` es
    // compartido con `sessionStorage`, y atarlo a una instancia fija mandaría sus escrituras al
    // storage equivocado.
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function (key: string, value: string) {
      original.call(this, key, value)
      if (key === 'sigu_user') {
        try {
          const { id } = JSON.parse(value) as { id: string }
          original.call(this, `sigu_tours_desactivados_${id}`, '1')
        } catch {
          // sigu_user con forma inesperada: se deja seguir, el tour en el peor caso se muestra.
        }
      }
    }
  })
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
