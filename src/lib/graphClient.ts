import { getGraphAccessToken } from "./graphAuth"

const GRAPH_BASE = "https://graph.microsoft.com/v1.0"

export async function graphRequest(path: string, options: RequestInit = {}) {
  const token = await getGraphAccessToken()
  const url = `${GRAPH_BASE}${path}`

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> || {}),
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Graph request failed: ${response.status} ${text}`)
  }

  if (response.status === 204) return null
  return response.json()
}
