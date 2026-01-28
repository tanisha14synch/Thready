/**
 * In-memory state store for OAuth CSRF protection
 * 
 * Note: For production with multiple servers, use Redis or a database
 */

interface StateData {
  nonce: string
  createdAt: number
  returnTo: string
}

const stateStore = new Map<string, StateData>()

// Cleanup expired states every 15 minutes
setInterval(() => {
  const now = Date.now()
  const expiryTime = 10 * 60 * 1000 // 10 minutes

  for (const [state, data] of stateStore.entries()) {
    if (now - data.createdAt > expiryTime) {
      stateStore.delete(state)
    }
  }
}, 15 * 60 * 1000)

/**
 * Store state data for OAuth flow
 */
export function setState(state: string, data: StateData): void {
  stateStore.set(state, data)
}

/**
 * Get state data from store
 */
export function getState(state: string): StateData | undefined {
  return stateStore.get(state)
}

/**
 * Delete state from store (after use)
 */
export function deleteState(state: string): void {
  stateStore.delete(state)
}
