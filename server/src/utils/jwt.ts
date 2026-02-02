import * as jose from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-change-in-production'

export interface JwtPayload {
  shop: string
  shopId: string
  iat?: number
  exp?: number
}

export async function signJwt(payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET)
  return await new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
}

export async function verifyJwt(token: string): Promise<JwtPayload | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jose.jwtVerify(token, secret)
    return payload as unknown as JwtPayload
  } catch {
    return null
  }
}
