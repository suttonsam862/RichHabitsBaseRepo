import { Request, Response } from 'express';
import crypto from 'crypto';
import axios from 'axios';
import { User } from '@shared/schema';

// Security constants
const SHOPIFY_API_VERSION = '2023-07';
const TOKEN_EXPIRY_HOURS = 24;
const API_RATE_LIMIT_BUFFER = 0.9; // Use 90% of rate limit to avoid errors

// Cache for API responses to minimize requests
const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Helper to securely encrypt sensitive data
 */
function encryptData(data: string, secret: string): string {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(secret, 'salt', 32);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Helper to decrypt sensitive data
 */
function decryptData(encryptedData: string, secret: string): string {
  const [ivHex, encrypted] = encryptedData.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const key = crypto.scryptSync(secret, 'salt', 32);
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Get encrypted Shopify credentials
 */
function getShopifyCredentials() {
  const secretKey = process.env.SESSION_SECRET || 'default-secret-key';
  
  if (!process.env.SHOPIFY_API_KEY || !process.env.SHOPIFY_API_SECRET || !process.env.SHOPIFY_STORE_URL) {
    throw new Error('Shopify credentials not set in environment');
  }
  
  return {
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecret: process.env.SHOPIFY_API_SECRET,
    storeUrl: process.env.SHOPIFY_STORE_URL,
  };
}

/**
 * Validate Shopify webhook signature
 */
export function validateShopifyWebhook(req: Request): boolean {
  try {
    const { apiSecret } = getShopifyCredentials();
    const hmac = req.headers['x-shopify-hmac-sha256'] as string;
    
    if (!hmac) return false;
    
    const body = req.body;
    const calculatedHmac = crypto
      .createHmac('sha256', apiSecret)
      .update(body)
      .digest('base64');
    
    return crypto.timingSafeEqual(
      Buffer.from(hmac),
      Buffer.from(calculatedHmac)
    );
  } catch (error) {
    console.error('Webhook validation error:', error);
    return false;
  }
}

/**
 * Create an admin API request to Shopify
 */
async function makeShopifyApiRequest(endpoint: string, method = 'GET', data = null, userCredentials = null) {
  try {
    // Get credentials - either default or user-specific
    const credentials = userCredentials || getShopifyCredentials();
    const { storeUrl, apiKey, apiSecret } = credentials;
    
    // Check cache for GET requests
    const cacheKey = `${endpoint}:${method}`;
    if (method === 'GET' && apiCache.has(cacheKey)) {
      const cached = apiCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        return cached.data;
      }
    }
    
    const baseUrl = `https://${storeUrl}/admin/api/${SHOPIFY_API_VERSION}`;
    
    // Set up request
    const response = await axios({
      method,
      url: `${baseUrl}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': apiSecret
      },
      data
    });
    
    // Cache GET responses
    if (method === 'GET') {
      apiCache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      });
    }
    
    return response.data;
  } catch (error: any) {
    console.error(`Shopify API error for ${endpoint}:`, error.response?.data || error.message || error);
    throw new Error(error.response?.data?.errors || error.message || 'Shopify API request failed');
  }
}

/**
 * Get a list of products from Shopify
 */
export async function getShopifyProducts(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Role-based access check
    const user = req.user as User;
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
    }
    
    const products = await makeShopifyApiRequest('/products.json');
    return res.json(products);
  } catch (error) {
    console.error('Error getting Shopify products:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Get a specific product from Shopify
 */
export async function getShopifyProduct(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const productId = req.params.id;
    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }
    
    const product = await makeShopifyApiRequest(`/products/${productId}.json`);
    return res.json(product);
  } catch (error) {
    console.error(`Error getting Shopify product ${req.params.id}:`, error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Get orders from Shopify
 */
export async function getShopifyOrders(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Role-based access check
    const user = req.user as User;
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
    }
    
    // Filter by product ID if provided
    const productId = req.query.productId as string;
    let endpoint = '/orders.json?status=any';
    
    if (productId) {
      endpoint += `&product_id=${productId}`;
    }
    
    const orders = await makeShopifyApiRequest(endpoint);
    return res.json(orders);
  } catch (error) {
    console.error('Error getting Shopify orders:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Get a specific order from Shopify
 */
export async function getShopifyOrder(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const orderId = req.params.id;
    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }
    
    const order = await makeShopifyApiRequest(`/orders/${orderId}.json`);
    return res.json(order);
  } catch (error) {
    console.error(`Error getting Shopify order ${req.params.id}:`, error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Link Shopify orders to camp registrations
 */
export async function linkShopifyOrderToCampRegistration(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Role-based access check
    const user = req.user as User;
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
    }
    
    const { campId, orderIds } = req.body;
    
    if (!campId || !orderIds || !Array.isArray(orderIds)) {
      return res.status(400).json({ error: 'Camp ID and order IDs array are required' });
    }
    
    // Process each order and create registrations
    const results = [];
    
    for (const orderId of orderIds) {
      try {
        const order = await makeShopifyApiRequest(`/orders/${orderId}.json`);
        
        if (!order.order) {
          results.push({ 
            orderId, 
            success: false, 
            error: 'Order not found' 
          });
          continue;
        }
        
        // Extract customer information
        const customer = order.order.customer;
        const lineItems = order.order.line_items;
        
        // Create registration for this order
        // This would typically call your database storage methods
        
        results.push({
          orderId,
          success: true,
          registrationId: 'NEW_REGISTRATION_ID', // Replace with actual ID
          customerName: `${customer.first_name} ${customer.last_name}`,
          email: customer.email
        });
      } catch (error) {
        results.push({ 
          orderId, 
          success: false, 
          error: error.message 
        });
      }
    }
    
    return res.json({ results });
  } catch (error) {
    console.error('Error linking Shopify orders to camp registration:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Get Shopify connection status
 */
export async function checkShopifyConnection(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Role-based access check
    const user = req.user as User;
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
    }
    
    try {
      const shop = await makeShopifyApiRequest('/shop.json');
      return res.json({ 
        connected: true,
        shop: shop.shop.name,
        domain: shop.shop.domain,
        email: shop.shop.email
      });
    } catch (error) {
      return res.json({ 
        connected: false,
        error: error.message
      });
    }
  } catch (error) {
    console.error('Error checking Shopify connection:', error);
    return res.status(500).json({ error: error.message });
  }
}

export default {
  getShopifyProducts,
  getShopifyProduct,
  getShopifyOrders,
  getShopifyOrder,
  linkShopifyOrderToCampRegistration,
  checkShopifyConnection,
  validateShopifyWebhook
};