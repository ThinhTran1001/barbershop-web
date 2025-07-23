import Cookies from 'js-cookie';

/**
 * Utility functions for handling JWT tokens from cookies
 */

/**
 * Decode JWT token without verification (client-side only)
 * Note: This is for reading payload data only, not for security validation
 * @param {string} token - JWT token string
 * @returns {object|null} - Decoded payload or null if invalid
 */
export const decodeJWT = (token) => {
  try {
    if (!token || typeof token !== 'string') {
      return null;
    }

    // JWT has 3 parts separated by dots: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    
    // Add padding if needed for base64 decoding
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    
    // Decode base64
    const decodedPayload = atob(paddedPayload);
    
    // Parse JSON
    return JSON.parse(decodedPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

/**
 * Get access token from cookies
 * @returns {string|null} - Access token or null if not found
 */
export const getAccessTokenFromCookie = () => {
  try {
    // Try to get from js-cookie first (for non-httpOnly cookies)
    let token = Cookies.get('accessToken');
    
    if (!token) {
      // For httpOnly cookies, we can't access them directly from JavaScript
      // In this case, you would need to make an API call to get the token
      // or use a different approach
      console.warn('AccessToken not found in accessible cookies. It might be httpOnly.');
      return null;
    }
    
    return token;
  } catch (error) {
    console.error('Error getting access token from cookie:', error);
    return null;
  }
};

/**
 * Get user ID from access token in cookies
 * @returns {string|null} - User ID or null if not found/invalid
 */
export const getUserIdFromToken = () => {
  try {
    const token = getAccessTokenFromCookie();
    if (!token) {
      return null;
    }

    const payload = decodeJWT(token);
    if (!payload) {
      return null;
    }

    // Return the user ID (could be 'id', '_id', or 'userId' depending on your backend)
    return payload.id || payload._id || payload.userId || null;
  } catch (error) {
    console.error('Error getting user ID from token:', error);
    return null;
  }
};

/**
 * Get full user data from access token in cookies
 * @returns {object|null} - User data object or null if not found/invalid
 */
export const getUserDataFromToken = () => {
  try {
    const token = getAccessTokenFromCookie();
    if (!token) {
      return null;
    }

    const payload = decodeJWT(token);
    if (!payload) {
      return null;
    }

    // Return user data from token payload
    return {
      id: payload.id || payload._id || payload.userId,
      email: payload.email,
      role: payload.role,
      name: payload.name,
      phone: payload.phone,
      // Add any other fields that might be in your JWT payload
    };
  } catch (error) {
    console.error('Error getting user data from token:', error);
    return null;
  }
};

/**
 * Check if access token exists and is valid format
 * @returns {boolean} - True if token exists and has valid format
 */
export const hasValidAccessToken = () => {
  try {
    const token = getAccessTokenFromCookie();
    if (!token) {
      return false;
    }

    const payload = decodeJWT(token);
    return payload !== null;
  } catch (error) {
    console.error('Error checking access token validity:', error);
    return false;
  }
};

/**
 * Check if token is expired (client-side check only)
 * Note: This is not secure validation, just for UX purposes
 * @returns {boolean} - True if token appears to be expired
 */
export const isTokenExpired = () => {
  try {
    const token = getAccessTokenFromCookie();
    if (!token) {
      return true;
    }

    const payload = decodeJWT(token);
    if (!payload || !payload.exp) {
      return true;
    }

    // Check if token is expired (exp is in seconds, Date.now() is in milliseconds)
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};

/**
 * Alternative method for httpOnly cookies - make API call to get user data
 * This is more secure as it doesn't expose the token to client-side JavaScript
 * @returns {Promise<object|null>} - User data from API or null if failed
 */
export const getUserDataFromAPI = async () => {
  try {
    // Import your API function
    const { getMe } = await import('../services/api.js');
    
    const response = await getMe();
    return response.data?.user || null;
  } catch (error) {
    console.error('Error getting user data from API:', error);
    return null;
  }
};

export default {
  decodeJWT,
  getAccessTokenFromCookie,
  getUserIdFromToken,
  getUserDataFromToken,
  hasValidAccessToken,
  isTokenExpired,
  getUserDataFromAPI
};
