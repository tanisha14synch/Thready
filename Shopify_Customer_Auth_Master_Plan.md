# Shopify Customer Authentication for Subdomain Community - Master Plan

**Document Version**: 1.0
**Created**: 2026-01-27
**Status**: Planning
**Stack**: Node.js / Fastify / Shopify Customer Account API (OAuth 2.0)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Prerequisites & Configuration](#prerequisites--configuration)
4. [Implementation Details](#implementation-details)
5. [Code Reference](#code-reference)
6. [Security Checklist](#security-checklist)
7. [Testing Plan](#testing-plan)
8. [Deployment Checklist](#deployment-checklist)
9. [Troubleshooting Guide](#troubleshooting-guide)

---

## Executive Summary

### Objective
Enable Shopify store customers to authenticate on a separate subdomain community (e.g., `community.yourdomain.com`) using their existing Shopify store credentials via OAuth 2.0.

### Architecture Pattern
```
Main Shopify Store → OAuth 2.0 Flow → Community Subdomain (Fastify Backend)
```

### Why Customer Account API (OAuth 2.0)
| Feature | Benefit |
|---------|---------|
| Works on all Shopify plans | Not limited to Shopify Plus |
| Official OAuth 2.0 flow | Secure, standardized, well-documented |
| Full customer data access | Profile, orders, addresses, metafields |
| No password handling | Shopify manages credentials securely |
| Familiar login UX | Customers use Shopify's trusted login page |

---

## Architecture Overview

### Authentication Flow Diagram

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   Community     │      │     Shopify      │      │   Community     │
│   Frontend      │      │   Login Page     │      │   Backend       │
└────────┬────────┘      └────────┬─────────┘      └────────┬────────┘
         │                        │                         │
         │ 1. Click "Login"       │                         │
         │──────────────────────────────────────────────────>│
         │                        │                         │
         │ 2. Redirect to Shopify │                         │
         │<─────────────────────────────────────────────────│
         │                        │                         │
         │ 3. User logs in        │                         │
         │───────────────────────>│                         │
         │                        │                         │
         │ 4. Redirect with code  │                         │
         │<───────────────────────│                         │
         │                        │                         │
         │ 5. Send code to backend                          │
         │──────────────────────────────────────────────────>│
         │                        │                         │
         │                        │  6. Exchange code       │
         │                        │<────────────────────────│
         │                        │                         │
         │                        │  7. Return tokens       │
         │                        │────────────────────────>│
         │                        │                         │
         │ 8. Set session cookie  │                         │
         │<─────────────────────────────────────────────────│
         │                        │                         │
```

### Project File Structure

```
community-backend/
├── src/
│   ├── routes/
│   │   ├── auth.js              # OAuth flow endpoints
│   │   └── community.js         # Protected community routes
│   ├── plugins/
│   │   ├── shopify.js           # Shopify API client
│   │   └── session.js           # JWT/cookie session management
│   ├── middleware/
│   │   └── authenticate.js      # Auth guard middleware
│   ├── services/
│   │   └── customer.js          # Customer data fetching service
│   └── app.js                   # Fastify app setup & entry point
├── .env                         # Environment secrets (gitignored)
├── .env.example                 # Environment template
└── package.json
```

---

## Prerequisites & Configuration

### Phase 1: Shopify App Configuration

#### Step 1.1: Update Custom App Settings

**Location**: Shopify Admin → Settings → Apps and sales channels → Develop apps

1. **Enable Customer Account API access scopes**:
   - Navigate to your custom app → Configuration
   - Under "Customer Account API access scopes", enable:
     - `customer_read_customers` - Read customer data
     - `customer_read_orders` - Read order history
     - `customer_read_customer_merge` - (optional) Merged customer data

2. **Configure OAuth redirect URIs**:
   ```
   https://community.yourdomain.com/auth/shopify/callback
   ```

3. **Record credentials** (store securely):
   - Client ID (API key)
   - Client Secret (API secret key)

#### Step 1.2: Enable New Customer Accounts

**Location**: Shopify Admin → Settings → Customer accounts

- Select **"New customer accounts"** (NOT Classic)
- This enables the Customer Account API authentication flow
- Save changes

### Environment Variables

Create `.env` file (never commit to version control):

```env
# ===========================================
# SHOPIFY CONFIGURATION
# ===========================================
SHOPIFY_CLIENT_ID=your_client_id_here
SHOPIFY_CLIENT_SECRET=your_client_secret_here
SHOPIFY_SHOP_DOMAIN=yourstore.myshopify.com

# ===========================================
# AUTHENTICATION
# ===========================================
JWT_SECRET=your_jwt_secret_minimum_32_characters_long
SESSION_SECRET=your_session_secret_for_state_storage

# ===========================================
# URLs
# ===========================================
COMMUNITY_URL=https://community.yourdomain.com
CALLBACK_URL=https://community.yourdomain.com/auth/shopify/callback
FRONTEND_URL=https://community.yourdomain.com

# ===========================================
# DATABASE (Optional - for persistent user records)
# ===========================================
DATABASE_URL=postgres://user:password@host:5432/community_db

# ===========================================
# ENVIRONMENT
# ===========================================
NODE_ENV=production
PORT=3000
```

### Required NPM Dependencies

```bash
npm install fastify @fastify/cookie @fastify/cors @fastify/rate-limit jsonwebtoken crypto
```

**Package.json dependencies**:
```json
{
  "dependencies": {
    "fastify": "^4.x",
    "@fastify/cookie": "^9.x",
    "@fastify/cors": "^9.x",
    "@fastify/rate-limit": "^9.x",
    "jsonwebtoken": "^9.x"
  }
}
```

---

## Implementation Details

### Phase 2: Core Backend Implementation

#### 2.1 Main Application Entry Point

**File**: `src/app.js`

```javascript
'use strict';

const fastify = require('fastify');
const cookie = require('@fastify/cookie');
const cors = require('@fastify/cors');
const rateLimit = require('@fastify/rate-limit');

const authRoutes = require('./routes/auth');
const communityRoutes = require('./routes/community');
const authenticate = require('./middleware/authenticate');

async function buildApp() {
  const app = fastify({
    logger: true,
    trustProxy: true // Required if behind reverse proxy
  });

  // ===========================================
  // PLUGINS REGISTRATION
  // ===========================================

  // Cookie support for session management
  await app.register(cookie, {
    secret: process.env.SESSION_SECRET,
    parseOptions: {}
  });

  // CORS configuration for subdomain access
  await app.register(cors, {
    origin: [
      process.env.FRONTEND_URL,
      process.env.COMMUNITY_URL,
      /\.yourdomain\.com$/  // Allow all subdomains
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  });

  // Rate limiting for security
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (req) => req.ip
  });

  // ===========================================
  // DECORATORS
  // ===========================================

  // Make authenticate middleware available globally
  app.decorate('authenticate', authenticate);

  // ===========================================
  // ROUTES
  // ===========================================

  // Auth routes (public)
  await app.register(authRoutes, { prefix: '/auth' });

  // Community routes (protected)
  await app.register(communityRoutes, { prefix: '/api/community' });

  // Health check endpoint
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  return app;
}

// Start server
async function start() {
  try {
    const app = await buildApp();
    const port = process.env.PORT || 3000;

    await app.listen({ port, host: '0.0.0.0' });
    console.log(`Server running on port ${port}`);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();

module.exports = { buildApp };
```

#### 2.2 Authentication Routes

**File**: `src/routes/auth.js`

```javascript
'use strict';

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { fetchCustomerProfile } = require('../services/customer');

// In-memory state storage (use Redis in production)
const stateStore = new Map();

async function authRoutes(fastify, options) {

  // ===========================================
  // GET /auth/shopify/login
  // Initiates OAuth flow - redirects to Shopify
  // ===========================================
  fastify.get('/shopify/login', async (request, reply) => {
    // Generate CSRF protection state
    const state = crypto.randomBytes(32).toString('hex');
    const nonce = crypto.randomBytes(32).toString('hex');

    // Store state for validation (expires in 10 minutes)
    stateStore.set(state, {
      nonce,
      createdAt: Date.now(),
      returnTo: request.query.returnTo || '/'
    });

    // Clean up expired states
    cleanupExpiredStates();

    // Build Shopify authorization URL
    const authUrl = buildAuthorizationUrl(state, nonce);

    fastify.log.info({ state }, 'Initiating OAuth flow');

    return reply.redirect(authUrl);
  });

  // ===========================================
  // GET /auth/shopify/callback
  // Handles OAuth callback from Shopify
  // ===========================================
  fastify.get('/shopify/callback', async (request, reply) => {
    const { code, state, error, error_description } = request.query;

    // Handle OAuth errors
    if (error) {
      fastify.log.error({ error, error_description }, 'OAuth error from Shopify');
      return reply.redirect(`${process.env.FRONTEND_URL}/login?error=${encodeURIComponent(error_description || error)}`);
    }

    // Validate required parameters
    if (!code || !state) {
      fastify.log.error('Missing code or state parameter');
      return reply.redirect(`${process.env.FRONTEND_URL}/login?error=invalid_request`);
    }

    // Validate state (CSRF protection)
    const storedState = stateStore.get(state);
    if (!storedState) {
      fastify.log.error({ state }, 'Invalid or expired state parameter');
      return reply.redirect(`${process.env.FRONTEND_URL}/login?error=invalid_state`);
    }

    // Remove used state
    stateStore.delete(state);

    // Check state expiry (10 minutes)
    if (Date.now() - storedState.createdAt > 10 * 60 * 1000) {
      fastify.log.error('State parameter expired');
      return reply.redirect(`${process.env.FRONTEND_URL}/login?error=state_expired`);
    }

    try {
      // Exchange authorization code for tokens
      const tokens = await exchangeCodeForTokens(code);

      // Fetch customer profile from Shopify
      const customer = await fetchCustomerProfile(tokens.access_token);

      // Create session JWT
      const sessionToken = jwt.sign(
        {
          customerId: customer.id,
          email: customer.email,
          firstName: customer.firstName,
          lastName: customer.lastName,
          displayName: `${customer.firstName} ${customer.lastName}`.trim(),
          shopifyAccessToken: tokens.access_token, // Store if needed for API calls
          iat: Math.floor(Date.now() / 1000)
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Set HTTP-only session cookie
      reply.setCookie('community_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        domain: extractRootDomain(process.env.COMMUNITY_URL),
        path: '/',
        maxAge: 7 * 24 * 60 * 60 // 7 days in seconds
      });

      fastify.log.info({ customerId: customer.id }, 'User authenticated successfully');

      // Redirect to original destination or home
      const returnTo = storedState.returnTo || '/';
      return reply.redirect(`${process.env.FRONTEND_URL}${returnTo}`);

    } catch (err) {
      fastify.log.error({ err }, 'Failed to complete OAuth flow');
      return reply.redirect(`${process.env.FRONTEND_URL}/login?error=authentication_failed`);
    }
  });

  // ===========================================
  // GET /auth/me
  // Returns current authenticated user
  // ===========================================
  fastify.get('/me', async (request, reply) => {
    const token = request.cookies.community_session;

    if (!token) {
      return reply.code(401).send({
        authenticated: false,
        error: 'Not authenticated'
      });
    }

    try {
      const user = jwt.verify(token, process.env.JWT_SECRET);

      return {
        authenticated: true,
        user: {
          customerId: user.customerId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          displayName: user.displayName
        }
      };
    } catch (err) {
      // Clear invalid cookie
      reply.clearCookie('community_session', {
        domain: extractRootDomain(process.env.COMMUNITY_URL),
        path: '/'
      });

      return reply.code(401).send({
        authenticated: false,
        error: 'Invalid or expired session'
      });
    }
  });

  // ===========================================
  // POST /auth/logout
  // Clears session and optionally revokes token
  // ===========================================
  fastify.post('/logout', async (request, reply) => {
    // Clear session cookie
    reply.clearCookie('community_session', {
      domain: extractRootDomain(process.env.COMMUNITY_URL),
      path: '/'
    });

    fastify.log.info('User logged out');

    return { success: true, message: 'Logged out successfully' };
  });

  // ===========================================
  // POST /auth/refresh
  // Refreshes the session token (optional)
  // ===========================================
  fastify.post('/refresh', async (request, reply) => {
    const token = request.cookies.community_session;

    if (!token) {
      return reply.code(401).send({ error: 'No session to refresh' });
    }

    try {
      const user = jwt.verify(token, process.env.JWT_SECRET);

      // Issue new token with refreshed expiry
      const newToken = jwt.sign(
        {
          customerId: user.customerId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          displayName: user.displayName,
          shopifyAccessToken: user.shopifyAccessToken,
          iat: Math.floor(Date.now() / 1000)
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      reply.setCookie('community_session', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        domain: extractRootDomain(process.env.COMMUNITY_URL),
        path: '/',
        maxAge: 7 * 24 * 60 * 60
      });

      return { success: true, message: 'Session refreshed' };

    } catch (err) {
      reply.clearCookie('community_session', {
        domain: extractRootDomain(process.env.COMMUNITY_URL),
        path: '/'
      });

      return reply.code(401).send({ error: 'Invalid session' });
    }
  });
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

function buildAuthorizationUrl(state, nonce) {
  const params = new URLSearchParams({
    client_id: process.env.SHOPIFY_CLIENT_ID,
    redirect_uri: process.env.CALLBACK_URL,
    scope: 'openid email customer-account-api:full',
    response_type: 'code',
    state: state,
    nonce: nonce
  });

  return `https://${process.env.SHOPIFY_SHOP_DOMAIN}/authentication/oauth/authorize?${params.toString()}`;
}

async function exchangeCodeForTokens(code) {
  const response = await fetch('https://shopify.com/authentication/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.SHOPIFY_CLIENT_ID,
      client_secret: process.env.SHOPIFY_CLIENT_SECRET,
      code: code,
      redirect_uri: process.env.CALLBACK_URL
    }).toString()
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  return response.json();
}

function extractRootDomain(url) {
  try {
    const hostname = new URL(url).hostname;
    const parts = hostname.split('.');
    // Return .domain.com for subdomain cookie sharing
    if (parts.length >= 2) {
      return '.' + parts.slice(-2).join('.');
    }
    return hostname;
  } catch {
    return undefined; // Let browser handle domain
  }
}

function cleanupExpiredStates() {
  const now = Date.now();
  const expiryTime = 10 * 60 * 1000; // 10 minutes

  for (const [state, data] of stateStore.entries()) {
    if (now - data.createdAt > expiryTime) {
      stateStore.delete(state);
    }
  }
}

module.exports = authRoutes;
```

#### 2.3 Customer Service

**File**: `src/services/customer.js`

```javascript
'use strict';

/**
 * Fetches customer profile from Shopify Customer Account API
 * @param {string} accessToken - Shopify OAuth access token
 * @returns {Promise<Object>} Customer profile data
 */
async function fetchCustomerProfile(accessToken) {
  const shopDomain = process.env.SHOPIFY_SHOP_DOMAIN;

  const query = `
    query {
      customer {
        id
        emailAddress {
          emailAddress
        }
        firstName
        lastName
        phoneNumber {
          phoneNumber
        }
        defaultAddress {
          address1
          address2
          city
          province
          provinceCode
          country
          countryCode
          zip
        }
        orders(first: 10) {
          nodes {
            id
            name
            totalPrice {
              amount
              currencyCode
            }
            processedAt
            fulfillmentStatus
          }
        }
        metafields(first: 10) {
          nodes {
            key
            namespace
            value
            type
          }
        }
      }
    }
  `;

  const response = await fetch(
    `https://shopify.com/${shopDomain}/account/customer/api/2024-01/graphql`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ query })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch customer profile: ${error}`);
  }

  const result = await response.json();

  if (result.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
  }

  const customer = result.data.customer;

  // Transform to consistent format
  return {
    id: customer.id,
    email: customer.emailAddress?.emailAddress,
    firstName: customer.firstName || '',
    lastName: customer.lastName || '',
    phone: customer.phoneNumber?.phoneNumber,
    defaultAddress: customer.defaultAddress,
    orders: customer.orders?.nodes || [],
    metafields: customer.metafields?.nodes || []
  };
}

/**
 * Fetches customer orders from Shopify
 * @param {string} accessToken - Shopify OAuth access token
 * @param {number} first - Number of orders to fetch
 * @returns {Promise<Array>} Array of orders
 */
async function fetchCustomerOrders(accessToken, first = 20) {
  const shopDomain = process.env.SHOPIFY_SHOP_DOMAIN;

  const query = `
    query($first: Int!) {
      customer {
        orders(first: $first) {
          nodes {
            id
            name
            orderNumber
            processedAt
            cancelledAt
            fulfillmentStatus
            financialStatus
            totalPrice {
              amount
              currencyCode
            }
            subtotalPrice {
              amount
              currencyCode
            }
            totalShippingPrice {
              amount
              currencyCode
            }
            totalTax {
              amount
              currencyCode
            }
            lineItems(first: 50) {
              nodes {
                title
                quantity
                originalTotalPrice {
                  amount
                  currencyCode
                }
                variant {
                  title
                  image {
                    url
                  }
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }
  `;

  const response = await fetch(
    `https://shopify.com/${shopDomain}/account/customer/api/2024-01/graphql`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ query, variables: { first } })
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch orders');
  }

  const result = await response.json();
  return result.data.customer.orders.nodes;
}

module.exports = {
  fetchCustomerProfile,
  fetchCustomerOrders
};
```

#### 2.4 Authentication Middleware

**File**: `src/middleware/authenticate.js`

```javascript
'use strict';

const jwt = require('jsonwebtoken');

/**
 * Authentication middleware for protected routes
 * Verifies JWT session token and attaches user to request
 */
async function authenticate(request, reply) {
  const token = request.cookies.community_session;

  if (!token) {
    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'Authentication required'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to request for route handlers
    request.user = {
      customerId: decoded.customerId,
      email: decoded.email,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      displayName: decoded.displayName,
      shopifyAccessToken: decoded.shopifyAccessToken
    };

  } catch (err) {
    // Differentiate between expired and invalid tokens
    if (err.name === 'TokenExpiredError') {
      return reply.code(401).send({
        error: 'SessionExpired',
        message: 'Your session has expired. Please log in again.'
      });
    }

    return reply.code(401).send({
      error: 'InvalidToken',
      message: 'Invalid authentication token'
    });
  }
}

module.exports = authenticate;
```

#### 2.5 Protected Community Routes

**File**: `src/routes/community.js`

```javascript
'use strict';

const { fetchCustomerOrders } = require('../services/customer');

async function communityRoutes(fastify, options) {

  // Apply authentication to all routes in this plugin
  fastify.addHook('preHandler', fastify.authenticate);

  // ===========================================
  // GET /api/community/profile
  // Returns authenticated user's profile
  // ===========================================
  fastify.get('/profile', async (request, reply) => {
    return {
      user: request.user
    };
  });

  // ===========================================
  // GET /api/community/orders
  // Returns user's Shopify order history
  // ===========================================
  fastify.get('/orders', async (request, reply) => {
    try {
      const orders = await fetchCustomerOrders(
        request.user.shopifyAccessToken,
        20
      );

      return { orders };

    } catch (err) {
      fastify.log.error({ err }, 'Failed to fetch orders');
      return reply.code(500).send({
        error: 'Failed to fetch orders'
      });
    }
  });

  // ===========================================
  // GET /api/community/dashboard
  // Returns community dashboard data
  // ===========================================
  fastify.get('/dashboard', async (request, reply) => {
    // Example: combine user data with community-specific data
    return {
      welcome: `Welcome back, ${request.user.firstName || 'Member'}!`,
      user: {
        displayName: request.user.displayName,
        email: request.user.email
      },
      // Add community-specific data here
      stats: {
        posts: 0,
        comments: 0,
        reputation: 0
      }
    };
  });
}

module.exports = communityRoutes;
```

---

## Phase 3: Session Management Details

### JWT Token Structure

```javascript
// Session token payload
{
  customerId: "gid://shopify/Customer/123456789",
  email: "customer@example.com",
  firstName: "John",
  lastName: "Doe",
  displayName: "John Doe",
  shopifyAccessToken: "shp_xxx...",  // For API calls
  iat: 1706400000,                    // Issued at
  exp: 1707004800                     // Expires (7 days)
}
```

### Cookie Configuration

| Property | Value | Purpose |
|----------|-------|---------|
| `httpOnly` | `true` | Prevents XSS access |
| `secure` | `true` (production) | HTTPS only |
| `sameSite` | `lax` | CSRF protection |
| `domain` | `.yourdomain.com` | Subdomain sharing |
| `maxAge` | `604800` (7 days) | Session duration |

---

## Phase 4: Database Schema (Optional)

For persistent community features, store linked customer records:

```sql
-- Users table
CREATE TABLE community_users (
  id SERIAL PRIMARY KEY,
  shopify_customer_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  avatar_url VARCHAR(500),
  role VARCHAR(50) DEFAULT 'member',  -- member, moderator, admin

  -- Token storage (encrypted)
  shopify_access_token_encrypted TEXT,
  shopify_refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMP,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_community_users_shopify_id ON community_users(shopify_customer_id);
CREATE INDEX idx_community_users_email ON community_users(email);

-- User activity tracking (optional)
CREATE TABLE user_activity_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES community_users(id),
  action VARCHAR(100) NOT NULL,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_activity_user_id ON user_activity_log(user_id);
CREATE INDEX idx_activity_created ON user_activity_log(created_at);
```

---

## Phase 5: Frontend Integration

### Login Button Component (React Example)

```javascript
// components/LoginButton.jsx
import React from 'react';

const API_BASE = process.env.REACT_APP_API_URL || 'https://community.yourdomain.com';

export function LoginButton({ returnTo = '/' }) {
  const handleLogin = () => {
    // Redirect to backend auth endpoint
    const loginUrl = new URL(`${API_BASE}/auth/shopify/login`);
    loginUrl.searchParams.set('returnTo', returnTo);
    window.location.href = loginUrl.toString();
  };

  return (
    <button onClick={handleLogin} className="login-button">
      Sign in with Shopify
    </button>
  );
}
```

### Auth Context Provider

```javascript
// context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/auth/me', {
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setUser(data.user);
        }
      }
    } catch (err) {
      console.error('Auth check failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      setUser(null);
      window.location.href = '/';
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### Protected Route Component

```javascript
// components/ProtectedRoute.jsx
import { useAuth } from '../context/AuthContext';
import { LoginButton } from './LoginButton';

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return (
      <div className="auth-required">
        <h2>Authentication Required</h2>
        <p>Please sign in to access this content.</p>
        <LoginButton returnTo={window.location.pathname} />
      </div>
    );
  }

  return children;
}
```

---

## Security Checklist

### Pre-Deployment Security Review

- [ ] **CSRF Protection**
  - [ ] Random `state` parameter generated before OAuth redirect
  - [ ] State validated on callback (timing + value)
  - [ ] State expires after 10 minutes
  - [ ] `nonce` included for OIDC flow

- [ ] **Token Security**
  - [ ] JWT secret is minimum 32 characters
  - [ ] Tokens stored in HTTP-only cookies (not localStorage)
  - [ ] Cookies marked as `secure` in production
  - [ ] `sameSite: lax` or `strict` configured

- [ ] **CORS Configuration**
  - [ ] Only trusted origins allowed
  - [ ] Credentials mode properly configured
  - [ ] No wildcard `*` origin with credentials

- [ ] **Rate Limiting**
  - [ ] Auth endpoints rate limited (10/min per IP)
  - [ ] API endpoints rate limited (100/min per IP)
  - [ ] Consider stricter limits on login endpoint

- [ ] **Input Validation**
  - [ ] All query parameters validated
  - [ ] No user input directly in URLs
  - [ ] Error messages don't leak sensitive info

- [ ] **Secrets Management**
  - [ ] All secrets in environment variables
  - [ ] `.env` file in `.gitignore`
  - [ ] No secrets in logs or error messages

- [ ] **HTTPS**
  - [ ] All endpoints HTTPS only
  - [ ] Secure cookies require HTTPS
  - [ ] HSTS headers configured

---

## Testing Plan

### Unit Tests

```javascript
// tests/auth.test.js
const { buildApp } = require('../src/app');

describe('Auth Routes', () => {
  let app;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /auth/shopify/login', () => {
    it('should redirect to Shopify with state parameter', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/auth/shopify/login'
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toContain('shopify.com');
      expect(response.headers.location).toContain('state=');
    });
  });

  describe('GET /auth/me', () => {
    it('should return 401 without session cookie', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/auth/me'
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.authenticated).toBe(false);
    });
  });

  describe('POST /auth/logout', () => {
    it('should clear session cookie', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/logout'
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['set-cookie']).toBeDefined();
    });
  });
});
```

### Integration Test Checklist

1. **OAuth Flow Test**
   - [ ] Click login redirects to Shopify
   - [ ] Can log in with test customer account
   - [ ] Callback sets session cookie correctly
   - [ ] Redirects to correct return URL

2. **Session Management**
   - [ ] `/auth/me` returns user data with valid cookie
   - [ ] `/auth/me` returns 401 with invalid cookie
   - [ ] `/auth/logout` clears session
   - [ ] Expired tokens handled gracefully

3. **Protected Routes**
   - [ ] Protected endpoints return 401 without auth
   - [ ] Protected endpoints work with valid auth
   - [ ] Customer data (orders, profile) fetched correctly

4. **Security Tests**
   - [ ] Invalid state parameter rejected
   - [ ] Expired state parameter rejected
   - [ ] CORS blocks unauthorized origins
   - [ ] Rate limiting activates correctly

---

## Deployment Checklist

### Pre-Deployment

- [ ] All environment variables set in production
- [ ] JWT_SECRET and SESSION_SECRET are unique and secure
- [ ] CORS origins match production domains
- [ ] SSL/TLS certificate valid for subdomain
- [ ] Database migrations run (if using DB)

### Deployment Steps

1. **Configure DNS**
   ```
   community.yourdomain.com → Your server IP
   ```

2. **Set Environment Variables**
   - Use secret manager (AWS Secrets, Vault, etc.)
   - Never commit secrets to version control

3. **Deploy Application**
   ```bash
   # Example PM2 deployment
   npm install --production
   pm2 start src/app.js --name community-auth
   ```

4. **Configure Reverse Proxy (Nginx)**
   ```nginx
   server {
       listen 443 ssl http2;
       server_name community.yourdomain.com;

       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

5. **Verify Shopify Configuration**
   - Confirm redirect URI matches exactly
   - Test with real customer account

### Post-Deployment Verification

- [ ] Health check endpoint responds
- [ ] OAuth flow completes successfully
- [ ] Session cookie set correctly
- [ ] Protected routes authenticate properly
- [ ] Logs show expected behavior
- [ ] No errors in monitoring

---

## Troubleshooting Guide

### Common Issues

#### "Invalid state parameter" Error
**Cause**: State mismatch or expired state
**Solutions**:
1. Check state store is persisting correctly
2. Verify no clock skew between servers
3. Ensure user completes OAuth within 10 minutes

#### "Token exchange failed" Error
**Cause**: Invalid code or credentials
**Solutions**:
1. Verify SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET
2. Confirm redirect_uri matches exactly (no trailing slash differences)
3. Check code hasn't expired (short validity window)

#### Session Cookie Not Set
**Cause**: Cookie domain mismatch or HTTPS issues
**Solutions**:
1. Verify domain is `.yourdomain.com` format
2. Confirm HTTPS is used in production
3. Check browser dev tools → Application → Cookies

#### CORS Errors
**Cause**: Origin not allowed
**Solutions**:
1. Add origin to CORS allowed list
2. Verify credentials mode consistent
3. Check preflight OPTIONS requests

#### "Customer not found" Error
**Cause**: Token doesn't have required scopes
**Solutions**:
1. Verify Customer Account API scopes enabled
2. Confirm "New customer accounts" setting active
3. Re-authenticate to get fresh token

### Debug Mode

Enable verbose logging:

```javascript
// In app.js
const app = fastify({
  logger: {
    level: 'debug',
    prettyPrint: process.env.NODE_ENV !== 'production'
  }
});
```

### Log Checklist for Debugging

```javascript
// Add these logs temporarily
fastify.log.debug({ state }, 'Generated OAuth state');
fastify.log.debug({ code: code?.substring(0, 10) }, 'Received callback');
fastify.log.debug({ tokenResponse: '...' }, 'Token exchange result');
fastify.log.debug({ customer }, 'Fetched customer profile');
```

---

## Alternative: Multipass (Shopify Plus Only)

If you have **Shopify Plus**, Multipass offers simpler SSO:

```javascript
const crypto = require('crypto');

function generateMultipassToken(customerData) {
  const secret = process.env.MULTIPASS_SECRET;

  // Derive keys
  const keyMaterial = crypto.createHash('sha256')
    .update(secret)
    .digest();
  const encryptionKey = keyMaterial.slice(0, 16);
  const signatureKey = keyMaterial.slice(16, 32);

  // Create customer JSON
  const customerJson = JSON.stringify({
    email: customerData.email,
    created_at: new Date().toISOString(),
    ...customerData
  });

  // Encrypt
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-128-cbc', encryptionKey, iv);
  let encrypted = cipher.update(customerJson, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  // Sign
  const ciphertext = Buffer.concat([iv, encrypted]);
  const signature = crypto.createHmac('sha256', signatureKey)
    .update(ciphertext)
    .digest();

  // Encode
  return Buffer.concat([ciphertext, signature])
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

// Usage
const token = generateMultipassToken({
  email: 'customer@example.com',
  first_name: 'John',
  last_name: 'Doe'
});

const loginUrl = `https://yourstore.myshopify.com/account/login/multipass/${token}`;
```

**Multipass Advantages**:
- No OAuth redirect needed
- Seamless SSO experience
- Server-side token generation

**Multipass Limitations**:
- Requires Shopify Plus subscription
- Must trust your authentication system

---

## Summary

| Phase | Key Deliverables |
|-------|-----------------|
| 1 | Shopify app configured with Customer Account API scopes, redirect URI set |
| 2 | Fastify backend with `/auth/shopify/login`, `/auth/shopify/callback`, `/auth/me`, `/auth/logout` |
| 3 | JWT session management with HTTP-only cookies for subdomain sharing |
| 4 | Security measures: CSRF state, rate limiting, CORS, secure cookies |
| 5 | (Optional) Database schema for persistent community user records |
| 6 | Frontend integration with login button, auth context, protected routes |

---

## References

- [Shopify Customer Account API Documentation](https://shopify.dev/docs/api/customer)
- [OAuth 2.0 for Customer Accounts](https://shopify.dev/docs/apps/auth/customer-accounts)
- [Fastify Documentation](https://www.fastify.io/docs/latest/)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)

---

*Document maintained by: Engineering Team*
*Last updated: 2026-01-27*
