/**
 * In-memory state store for OAuth CSRF protection
 * 
 * In production, use Redis or a database for distributed systems
 */

interface StateData {
  nonce: string
  createdAt: number
  returnTo: string
}

const stateStore = new Map<string, StateData>()

const STATE_EXPIRY_MS = 10 * 60 * 1000 // 10 minutes

/**
 * Store state data for OAuth flow
 */
export function setState(state: string, data: StateData): void {
  stateStore.set(state, data)
  cleanupExpiredStates()
}

/**
 * Get state data
 */
export function getState(state: string): StateData | undefined {
  const data = stateStore.get(state)
  if (!data) {
    return undefined
  }

  // Check expiry
  if (Date.now() - data.createdAt > STATE_EXPIRY_MS) {
    stateStore.delete(state)
    return undefined
  }

  return data
}

/**
 * Delete state after use
 */
export function deleteState(state: string): void {
  stateStore.delete(state)
}

/**
 * Clean up expired states
 */
function cleanupExpiredStates(): void {
  const now = Date.now()
  for (const [state, data] of stateStore.entries()) {
    if (now - data.createdAt > STATE_EXPIRY_MS) {
      stateStore.delete(state)
    }
  }
}

// Clean up expired states every 5 minutes
setInterval(cleanupExpiredStates, 5 * 60 * 1000)
