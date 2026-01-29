/**
 * In-memory store for OAuth state (CSRF protection).
 * Used during Customer Account API OAuth flow.
 */

export interface StateData {
  nonce: string
  createdAt: number
  returnTo?: string
}

const stateStore = new Map<string, StateData>()

export function setState(state: string, data: StateData): void {
  stateStore.set(state, data)
}

export function getState(state: string): StateData | undefined {
  return stateStore.get(state)
}

export function deleteState(state: string): boolean {
  return stateStore.delete(state)
}
