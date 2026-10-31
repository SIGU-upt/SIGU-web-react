// Reglas de validación reutilizables para react-hook-form.
// Mantienen el estilo de reglas inline ya usado en los formularios, pero centralizan
// los criterios comunes: no permitir solo espacios en requeridos, correos válidos,
// cédula con formato mínimo y números no negativos.

/** Rechaza cadenas vacías o compuestas solo por espacios en blanco. */
export const noWhitespaceOnly = (value: unknown): true | string =>
  (typeof value === 'string' && value.trim().length > 0) ||
  'No puede contener solo espacios en blanco';

/** Campo de texto requerido que además no admite solo espacios. */
export const requiredTextRule = {
  required: 'Requerido',
  validate: { noWhitespace: noWhitespaceOnly },
  setValueAs: (value: unknown) => (typeof value === 'string' ? value.trim() : value),
};

/**
 * Nombres y apellidos de personas: solo letras de cualquier alfabeto, espacios, apóstrofes y guiones.
 * Es la misma regla que aplica el API (@Matches con \p{L}); así el error sale antes de enviar.
 */
export const nameRule = {
  ...requiredTextRule,
  pattern: { value: /^[\p{L}'’\- ]+$/u, message: 'Solo letras, espacios, apóstrofes y guiones' },
};

/** Correo electrónico con formato válido. */
export const emailRule = {
  required: 'Requerido',
  pattern: {
    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Ingrese un correo electrónico válido',
  },
  setValueAs: (value: unknown) => (typeof value === 'string' ? value.trim() : value),
};

/**
 * Cédula venezolana con formato mínimo: prefijo opcional (V/E/J/G), guion opcional
 * y de 6 a 9 dígitos. Ejemplos válidos: "V-12345678", "12345678", "E-1234567".
 */
export const ciRule = {
  required: 'Requerido',
  pattern: {
    value: /^[VEJGvejg]?-?\d{6,9}$/,
    message: 'Cédula inválida. Formato esperado: V-12345678',
  },
  setValueAs: (value: unknown) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
};

/**
 * Cédula en el formato con que el API la guarda y busca en el login (`V-12345678`).
 * Una cédula de solo dígitos se toma como venezolana. Se usa al editar para detectar
 * cédulas que quedaron guardadas sin prefijo (p. ej. por una importación) y corregirlas.
 */
export const normalizarCi = (ci: string): string => {
  const limpia = ci.trim().toUpperCase().replace(/\s+/g, '')
  const conPrefijo = /^([VE])-?(\d+)$/.exec(limpia)
  if (conPrefijo) return `${conPrefijo[1]}-${conPrefijo[2]}`
  return /^\d+$/.test(limpia) ? `V-${limpia}` : limpia
}

/** Número requerido que no admite valores negativos. */
export const nonNegativeNumberRule = {
  required: 'Requerido',
  min: { value: 0, message: 'No se permiten valores negativos' },
  valueAsNumber: true,
};
