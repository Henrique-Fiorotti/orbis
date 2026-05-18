export function getWhatsappUrl(value) {
  const digits = String(value ?? "").replace(/\D/g, "")

  if (digits.length < 10) {
    return null
  }

  const normalizedDigits = digits.startsWith("55") ? digits : `55${digits}`

  return `https://wa.me/${normalizedDigits}`
}
