import { getGraphConfig } from "./env"

let tokenCache = {
  accessToken: "",
  expiresAt: 0,
}

export async function getGraphAccessToken() {
  const now = Date.now()
  if (tokenCache.accessToken && tokenCache.expiresAt - 60_000 > now) {
    return tokenCache.accessToken
  }

  const { tenantId, clientId, clientSecret } = getGraphConfig()
  const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope: "https://graph.microsoft.com/.default",
  })

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Graph auth failed: ${response.status} ${text}`)
  }

  const data = await response.json()
  tokenCache = {
    accessToken: data.access_token,
    expiresAt: now + (Number(data.expires_in || 3600) * 1000),
  }

  return tokenCache.accessToken
}
