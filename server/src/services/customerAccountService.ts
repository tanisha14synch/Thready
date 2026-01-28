/**
 * Customer Account Service
 * 
 * Service layer for Customer Account API operations
 */

import { fetchCustomerAccountProfile } from '../utils/customerAccountOAuth.js'

/**
 * Fetch customer profile from Shopify Customer Account API
 * 
 * @param accessToken - Shopify OAuth access token
 * @returns Customer profile data
 */
export async function getCustomerProfile(accessToken: string) {
  return fetchCustomerAccountProfile(accessToken)
}

/**
 * Fetch customer orders from Shopify
 * 
 * @param accessToken - Shopify OAuth access token
 * @param first - Number of orders to fetch
 * @returns Array of orders
 */
export async function getCustomerOrders(accessToken: string, first: number = 20) {
  // This would use a similar GraphQL query as fetchCustomerAccountProfile
  // but focused on orders. For now, orders are included in profile fetch.
  // Can be extracted to a separate function if needed.
  const profile = await fetchCustomerAccountProfile(accessToken)
  return profile.orders || []
}
