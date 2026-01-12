/**
 * Shopify OAuth 2.0 Authorization Code Flow - Complete Example
 * 
 * This is a standalone Node.js script demonstrating the complete OAuth 2.0 flow.
 * It can be run independently or integrated into your existing Fastify server.
 * 
 * Requirements:
 * - Node.js 18+
 * - npm packages: express (or fastify), node-fetch (or native fetch)
 * 
 * Setup:
 * 1. Replace {API_KEY}, {API_SECRET}, {SHOP_NAME}, {REDIRECT_URI} with your values
 * 2. Install dependencies: npm install express
 * 3. Run: node shopify-oauth-example.js
 */

import express from 'express'
import crypto from 'crypto'

// ============================================================================
// CONFIGURATION - Replace these with your actual values
// ============================================================================

const CONFIG = {
  // Your Shopify App API Key (Client ID)
  API_KEY: process.env.SHOPIFY_CLIENT_ID || '7e98895f9eb682f3bf2bcd7f7b5c67cf',
  
  // Your Shopify App API Secret
  API_SECRET: process.env.SHOPIFY_API_SECRET || 'c176d6c703481b2c51994dab53a6e193',
  
  // Your shop domain (e.g., "thebarwardrobe.myshopify.com")
  SHOP_NAME: process.env.SHOPIFY_SHOP || 'thebarwardrobe.myshopify.com',
  
  // Redirect URI (must match your app settings in Shopify Partner Dashboard)
  REDIRECT_URI: process.env.SHOPIFY_REDIRECT_URI || 'http://localhost:3001/auth/shopify/callback',
  
  // Server port
  PORT: process.env.PORT || 3001,
  
  // Scopes to request from Shopify
  SCOPES: ['read_customers', 'read_customer_tags'],
}

// ============================================================================
// STEP 1: Generate Authorization URL
// ============================================================================

/**
 * Generates the Shopify OAuth authorization URL
 * 
 * This URL redirects users to Shopify where they:
 * 1. Log in to their Shopify account
 * 2. Review the permissions your app is requesting
 * 3. Click "Install app" or "Allow"
 * 4. Get redirected back to your REDIRECT_URI with an authorization code
 * 
 * @param {string} shop - Shop domain
 * @param {string[]} scopes - Permission scopes
 * @param {string} state - Optional state parameter for CSRF protection
 * @returns {string} Authorization URL
 */
function generateAuthorizationUrl(shop, scopes = CONFIG.SCOPES, state = null) {
  // Generate random state if not provided (for CSRF protection)
  const stateParam = state || crypto.randomBytes(16).toString('hex')
  
  // Ensure shop domain format is correct
  const shopDomain = shop.includes('.myshopify.com') ? shop : `${shop}.myshopify.com`
  
  // Build query parameters
  const params = new URLSearchParams({
    client_id: CONFIG.API_KEY,
    scope: scopes.join(','),
    redirect_uri: CONFIG.REDIRECT_URI,
    state: stateParam,
  })
  
  // Construct the full authorization URL
  const authUrl = `https://${shopDomain}/admin/oauth/authorize?${params.toString()}`
  
  console.log('📝 Generated authorization URL:', authUrl)
  return authUrl
}

// ============================================================================
// STEP 2: Verify HMAC Signature
// ============================================================================

/**
 * Verifies the HMAC signature from Shopify callback
 * 
 * Shopify includes an HMAC parameter in the callback query string to verify
 * the request authenticity. This prevents tampering with the authorization code.
 * 
 * @param {Object} query - Query parameters from callback URL
 * @returns {boolean} True if HMAC is valid
 */
function verifyHMAC(query) {
  const hmac = query.hmac
  if (!hmac) {
    console.error('❌ No HMAC parameter found')
    return false
  }
  
  // Remove hmac and signature from params for verification
  const params = { ...query }
  delete params.hmac
  delete params.signature
  
  // Sort keys and create message string (Shopify's format)
  const message = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&')
  
  // Calculate HMAC using SHA256
  const computedHmac = crypto
    .createHmac('sha256', CONFIG.API_SECRET)
    .update(message)
    .digest('hex')
  
  // Timing-safe comparison to prevent timing attacks
  try {
    const isValid = crypto.timingSafeEqual(
      Buffer.from(computedHmac, 'utf8'),
      Buffer.from(hmac, 'utf8')
    )
    
    if (isValid) {
      console.log('✅ HMAC verification successful')
    } else {
      console.error('❌ HMAC verification failed')
    }
    
    return isValid
  } catch (error) {
    console.error('❌ HMAC comparison error:', error.message)
    return false
  }
}

// ============================================================================
// STEP 3: Exchange Authorization Code for Access Token
// ============================================================================

/**
 * Exchanges the authorization code for an access token
 * 
 * After Shopify redirects back with an authorization code, we exchange it
 * for an access token that can be used to make API calls.
 * 
 * @param {string} shop - Shop domain
 * @param {string} code - Authorization code from Shopify callback
 * @returns {Promise<Object>} Access token and associated data
 */
async function exchangeCodeForToken(shop, code) {
  // Ensure shop domain format is correct
  const shopDomain = shop.includes('.myshopify.com') ? shop : `${shop}.myshopify.com`
  const tokenUrl = `https://${shopDomain}/admin/oauth/access_token`
  
  // Prepare request body
  const body = {
    client_id: CONFIG.API_KEY,
    client_secret: CONFIG.API_SECRET,
    code,
  }
  
  console.log(`🔄 Exchanging code for token at: ${tokenUrl}`)
  
  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }
    
    const data = await response.json()
    console.log('✅ Successfully obtained access token')
    console.log('   Scope:', data.scope)
    console.log('   Shop:', data.shop)
    
    return data
  } catch (error) {
    console.error('❌ Token exchange failed:', error.message)
    throw error
  }
}

// ============================================================================
// STEP 4: Fetch Customer Data Using Access Token
// ============================================================================

/**
 * Fetches customer data from Shopify Admin API using the access token
 * 
 * @param {string} shop - Shop domain
 * @param {string} accessToken - OAuth access token
 * @param {string} customerId - Optional customer ID (if not provided, fetches all)
 * @returns {Promise<Object|Array>} Customer data
 */
async function fetchCustomers(shop, accessToken, customerId = null) {
  const shopDomain = shop.includes('.myshopify.com') ? shop : `${shop}.myshopify.com`
  
  // Build API URL - fetch specific customer or list all
  const apiUrl = customerId
    ? `https://${shopDomain}/admin/api/2024-01/customers/${customerId}.json`
    : `https://${shopDomain}/admin/api/2024-01/customers.json`
  
  console.log(`📡 Fetching customers from: ${apiUrl}`)
  
  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }
    
    const data = await response.json()
    const customers = customerId ? data.customer : data.customers
    
    console.log(`✅ Successfully fetched ${Array.isArray(customers) ? customers.length : 1} customer(s)`)
    
    return customers
  } catch (error) {
    console.error('❌ Failed to fetch customers:', error.message)
    throw error
  }
}

// ============================================================================
// EXPRESS SERVER SETUP
// ============================================================================

const app = express()

// Middleware to parse JSON
app.use(express.json())

// ============================================================================
// ROUTE 1: Initiate OAuth Flow
// ============================================================================

/**
 * GET /auth/shopify/authorize
 * 
 * Redirects user to Shopify authorization page
 * 
 * Query parameters:
 * - shop (optional): Shop domain. If not provided, uses CONFIG.SHOP_NAME
 */
app.get('/auth/shopify/authorize', (req, res) => {
  try {
    const shop = req.query.shop || CONFIG.SHOP_NAME
    
    if (!shop) {
      return res.status(400).json({
        error: 'Shop parameter is required. Provide ?shop=yourstore.myshopify.com',
      })
    }
    
    console.log(`\n🚀 Initiating OAuth flow for shop: ${shop}`)
    
    // Generate authorization URL
    const authUrl = generateAuthorizationUrl(shop)
    
    // Redirect user to Shopify
    console.log('↪️  Redirecting to Shopify...\n')
    res.redirect(authUrl)
  } catch (error) {
    console.error('❌ Authorization error:', error.message)
    res.status(500).json({
      error: 'Failed to initiate OAuth flow',
      message: error.message,
    })
  }
})

// ============================================================================
// ROUTE 2: Handle OAuth Callback
// ============================================================================

/**
 * GET /auth/shopify/callback
 * 
 * Handles the redirect from Shopify after user authorization
 * 
 * Query parameters (from Shopify):
 * - code: Authorization code
 * - shop: Shop domain
 * - hmac: HMAC signature for verification
 * - state: State parameter (if provided)
 */
app.get('/auth/shopify/callback', async (req, res) => {
  try {
    const { code, shop, hmac, state, error } = req.query
    
    console.log('\n📥 Received OAuth callback')
    console.log('   Shop:', shop)
    console.log('   State:', state)
    
    // Check for OAuth errors
    if (error) {
      console.error('❌ OAuth error:', error)
      return res.status(400).json({
        error: 'OAuth authorization failed',
        details: error,
      })
    }
    
    // Validate required parameters
    if (!code || !shop) {
      return res.status(400).json({
        error: 'Missing required parameters: code and shop are required',
      })
    }
    
    // Step 1: Verify HMAC signature
    console.log('\n🔐 Verifying HMAC signature...')
    if (!verifyHMAC(req.query)) {
      return res.status(401).json({
        error: 'Invalid request signature',
      })
    }
    
    // Step 2: Exchange code for access token
    console.log('\n🔄 Exchanging authorization code for access token...')
    const tokenData = await exchangeCodeForToken(shop, code)
    const { access_token, scope, shop: shopDomain } = tokenData
    
    // Step 3: Fetch customer data
    console.log('\n📡 Fetching customer data...')
    const customers = await fetchCustomers(shopDomain, access_token)
    
    // Display results
    console.log('\n✅ OAuth flow completed successfully!')
    console.log('\n📊 Results:')
    console.log('   Access Token:', access_token.substring(0, 20) + '...')
    console.log('   Scope:', scope)
    console.log('   Shop:', shopDomain)
    console.log('   Customers found:', Array.isArray(customers) ? customers.length : 1)
    
    if (Array.isArray(customers) && customers.length > 0) {
      console.log('\n👤 First customer:')
      const firstCustomer = customers[0]
      console.log('   ID:', firstCustomer.id)
      console.log('   Email:', firstCustomer.email)
      console.log('   Name:', `${firstCustomer.first_name || ''} ${firstCustomer.last_name || ''}`.trim())
      console.log('   Tags:', firstCustomer.tags || 'None')
    }
    
    // In a real application, you would:
    // 1. Store the access token securely
    // 2. Create/update user in your database
    // 3. Generate a JWT for your app
    // 4. Redirect to your frontend
    
    // For this example, we'll just return the data
    res.json({
      success: true,
      message: 'OAuth flow completed successfully',
      data: {
        access_token: access_token.substring(0, 20) + '...', // Truncated for security
        scope,
        shop: shopDomain,
        customers_count: Array.isArray(customers) ? customers.length : 1,
        first_customer: Array.isArray(customers) ? customers[0] : customers,
      },
    })
  } catch (error) {
    console.error('\n❌ OAuth callback error:', error.message)
    res.status(500).json({
      error: 'OAuth callback failed',
      message: error.message,
    })
  }
})

// ============================================================================
// ROUTE 3: Test Endpoint
// ============================================================================

/**
 * GET /
 * 
 * Simple test endpoint with instructions
 */
app.get('/', (req, res) => {
  res.json({
    message: 'Shopify OAuth 2.0 Example Server',
    endpoints: {
      authorize: `GET /auth/shopify/authorize?shop=${CONFIG.SHOP_NAME}`,
      callback: 'GET /auth/shopify/callback (called by Shopify)',
    },
    config: {
      shop: CONFIG.SHOP_NAME,
      redirect_uri: CONFIG.REDIRECT_URI,
      scopes: CONFIG.SCOPES,
    },
    instructions: [
      `1. Visit: http://localhost:${CONFIG.PORT}/auth/shopify/authorize?shop=${CONFIG.SHOP_NAME}`,
      '2. Log in to Shopify and authorize the app',
      '3. You will be redirected back with customer data',
    ],
  })
})

// ============================================================================
// START SERVER
// ============================================================================

app.listen(CONFIG.PORT, () => {
  console.log('\n🚀 Shopify OAuth 2.0 Example Server')
  console.log('=====================================')
  console.log(`📍 Server running on http://localhost:${CONFIG.PORT}`)
  console.log(`\n🔗 To start OAuth flow, visit:`)
  console.log(`   http://localhost:${CONFIG.PORT}/auth/shopify/authorize?shop=${CONFIG.SHOP_NAME}`)
  console.log(`\n⚙️  Configuration:`)
  console.log(`   API Key: ${CONFIG.API_KEY.substring(0, 10)}...`)
  console.log(`   Shop: ${CONFIG.SHOP_NAME}`)
  console.log(`   Redirect URI: ${CONFIG.REDIRECT_URI}`)
  console.log(`   Scopes: ${CONFIG.SCOPES.join(', ')}`)
  console.log('\n✨ Ready to authenticate!\n')
})






