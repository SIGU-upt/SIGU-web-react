import { test, expect } from '@playwright/test'
import { login, scanContraste, setTema, vigilarPayloads } from './helpers'
import { CREDENTIALS } from './credentials'

// El DOCENTE entra al panel web: el API (auth.service.ts, ROLES_POR_CLIENTE.WEB) lo admite
// y acota sus reportes a sus propias clases y a los alumnos inscritos en ellas. Su Dashboard
// muestra solo cifras propias (GET /dashboard), y no tiene "Por Trayecto" ni "Alumnos en
// Riesgo" (roster de toda la jurisdicción).
test.describe('DOCENTE', () => {
  test('entra al panel, ve su propio dashboard y solo lo suyo', async ({ page }) => {
    const hallazgosPayload = vigilarPayloads(page)
    await login(page, CREDENTIALS.docente)

    // Dashboard propio: sin cifras institucionales, solo las del docente.
    await expect(page.getByText('Alumnos inscritos')).toBeVisible()
    await expect(page.getByText('Inasistencias por justificar')).toBeVisible()
    await expect(page.getByText('Total Usuarios')).toHaveCount(0)

    // El breadcrumb también dice "Dashboard" estando en esta página — se acota al <ul> del
    // sidebar para no ambigüar con el link (no interactivo) del breadcrumb.
    await expect(page.locator('ul').getByRole('link', { name: 'Dashboard' })).toBeVisible()
    // Fase 7 (3/11/2026): horario semanal propio + QR de asistencia por clase.
    await expect(page.getByRole('link', { name: 'Mis Clases' })).toBeVisible()
    // El Dashboard tiene una tarjeta con un link "Ir a Reportes" — coincide por substring con
    // "Reportes", así que se acota al <ul> del sidebar (mismo criterio que el link "Dashboard"
    // arriba).
    await expect(page.locator('ul').getByRole('link', { name: 'Reportes' })).toBeVisible()
    for (const nombre of ['Secciones', 'Cohortes', 'Configuración', 'Seguridad']) {
      await expect(page.getByRole('link', { name: nombre })).toHaveCount(0)
    }

    await page.getByRole('link', { name: 'Mis Clases' }).click()
    await page.waitForURL('**/mis-clases')
    // La grilla semanal (o el mensaje de "sin clases") debe terminar de cargar
    // sin quedarse en "Cargando..." — confirma que GET /clases/mi-horario responde.
    await expect(page.getByText('Cargando...')).toHaveCount(0, { timeout: 15_000 })
    await setTema(page, 'dark')
    expect(await scanContraste(page), 'Mis Clases DOCENTE, tema oscuro').toEqual([])

    await page.getByRole('link', { name: 'Reportes' }).click()
    await page.waitForURL('**/reportes')

    await expect(page.getByRole('tab', { name: 'Por Clase' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Por Alumno' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Por Trayecto' })).toHaveCount(0)
    await expect(page.getByRole('tab', { name: 'Alumnos en Riesgo' })).toHaveCount(0)

    await setTema(page, 'dark')
    expect(await scanContraste(page), 'Reportes DOCENTE, tema oscuro').toEqual([])
    await page.getByRole('link', { name: 'Dashboard' }).click()
    await page.waitForURL('**/dashboard')
    expect(await scanContraste(page), 'Dashboard DOCENTE, tema oscuro').toEqual([])

    expect(hallazgosPayload, 'payloads con campos sensibles').toEqual([])
  })

  test('escribir la URL de una pantalla de administración da acceso denegado', async ({ page }) => {
    await login(page, CREDENTIALS.docente)
    await page.goto('/secciones')
    await expect(page.getByText('Acceso denegado')).toBeVisible()
    await page.goto('/pnfs/00000000-0000-0000-0000-000000000000')
    await expect(page.getByText('Acceso denegado')).toBeVisible()
  })
})
