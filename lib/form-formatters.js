export function sanitizeDecimalInput(value, { decimalPlaces = 2 } = {}) {
  const normalized = String(value ?? "").replace(",", ".")
  const numericOnly = normalized.replace(/[^\d.]/g, "")
  const firstDotIndex = numericOnly.indexOf(".")

  if (firstDotIndex === -1) {
    return numericOnly
  }

  const integerPart = numericOnly.slice(0, firstDotIndex)
  const decimalPart = numericOnly
    .slice(firstDotIndex + 1)
    .replace(/\./g, "")
    .slice(0, decimalPlaces)

  return `${integerPart}.${decimalPart}`
}

export function parseDecimalInput(value) {
  const normalized = String(value ?? "").trim().replace(",", ".")

  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    return NaN
  }

  return Number(normalized)
}

export function formatBrazilianPhoneInput(value) {
  const digits = String(value ?? "").replace(/\D/g, "").slice(0, 11)

  if (digits.length <= 2) {
    return digits ? `(${digits}` : ""
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function isValidBrazilianPhone(value) {
  return /^(\(?[0-9]{2}\)?) ?([0-9]{4,5})-?([0-9]{4})$/.test(String(value ?? "").trim())
}

export function isValidEmail(value) {
  return /^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/.test(String(value ?? "").trim())
}

export function isValidBackendPassword(value) {
  const password = String(value ?? "")

  return (
    password.length >= 7 &&
    !/\s/.test(password) &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  )
}
