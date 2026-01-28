declare module 'jsonwebtoken' {
  export interface SignOptions {
    expiresIn?: string | number
    algorithm?: string
    [key: string]: any
  }

  export function sign(payload: any, secret: string, options?: SignOptions): string
  export function verify(token: string, secret: string): any
  export function decode(token: string): any
}
