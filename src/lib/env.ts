export function getGraphConfig() {
  const tenantId = required("TENANT_ID")
  const clientId = required("CLIENT_ID")
  const clientSecret = required("CLIENT_SECRET")

  const encargadoEmail = (process.env.ENCARGADO_EMAIL || process.env.DOCTOR_EMAIL || "").trim()
  if (!encargadoEmail) {
    throw new Error("Missing required environment variable: ENCARGADO_EMAIL")
  }

  return { tenantId, clientId, clientSecret, encargadoEmail }
}

function required(name: string) {
  const value = process.env[name]
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value.trim()
}
