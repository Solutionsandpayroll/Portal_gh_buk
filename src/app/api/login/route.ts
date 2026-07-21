import { NextResponse } from "next/server"
import crypto from "crypto"

function createToken(username: string, secret: string) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")
  const payload = Buffer.from(
    JSON.stringify({
      sub: username,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
    })
  ).toString("base64url")
  const sig = crypto
    .createHmac("sha256", secret)
    .update(`${header}.${payload}`)
    .digest("base64url")
  return `${header}.${payload}.${sig}`
}

export async function POST(request: Request) {
  const { username, password } = (await request.json()) ?? {}

  if (!username || typeof username !== "string" || !username.trim()) {
    return NextResponse.json({ error: "Nombre de usuario requerido." }, { status: 400 })
  }
  if (!password || typeof password !== "string") {
    return NextResponse.json({ error: "Contraseña requerida." }, { status: 400 })
  }

  const APP_PASSWORD = process.env.APP_PASSWORD ?? ""
  const APP_JWT_SECRET = process.env.APP_JWT_SECRET

  if (!APP_PASSWORD || !APP_JWT_SECRET) {
    return NextResponse.json({ error: "Error de configuración del servidor." }, { status: 500 })
  }

  let passwordsMatch = false
  try {
    const pwdBuffer = Buffer.from(password)
    const validBuffer = Buffer.from(APP_PASSWORD)
    if (pwdBuffer.length === validBuffer.length) {
      passwordsMatch = crypto.timingSafeEqual(pwdBuffer, validBuffer)
    }
  } catch {
    passwordsMatch = false
  }

  if (!passwordsMatch) {
    return NextResponse.json({ error: "Contraseña incorrecta." }, { status: 401 })
  }

  const token = createToken(username.trim(), APP_JWT_SECRET)
  return NextResponse.json({ token, username: username.trim() })
}
