import { storage } from './storage';

const BASE_URL = 'https://buildsure-server-770307294180.europe-west1.run.app/api/v1';

// We support setting this statically via env variables, or dynamically at runtime.
let stagingBearerToken = process.env.EXPO_PUBLIC_STAGING_BEARER_TOKEN || 'bearerToken'; 

export const setStagingBearerToken = (token: string) => {
  stagingBearerToken = token;
};

export const getStagingBearerToken = () => stagingBearerToken;

export interface ApiError {
  message: string;
  statusCode?: number;
  error?: string;
  details?: any;
}

/**
 * Custom error class representing API failures
 */
export class BuildsureApiError extends Error {
  statusCode?: number;
  details?: any;

  constructor(message: string, statusCode?: number, details?: any) {
    super(message);
    this.name = 'BuildsureApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

interface RequestOptions extends RequestInit {
  bodyData?: any;
  userToken?: string | null;
}

/**
 * Standard HTTP Request Wrapper
 */
async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  
  // Set up standard headers
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  // Attach the authorization header. 
  // Priority: 
  // 1. Explicit userToken (e.g. dynamic JWT from user session)
  // 2. Dynamic JWT from persistent storage
  // 3. Fallback to Staging bearer token
  let token = options.userToken;
  if (!token || token === 'bearerToken') {
    const savedToken = await storage.getItem('buildsure_auth_token');
    if (savedToken) {
      token = savedToken;
    } else if (stagingBearerToken && stagingBearerToken !== 'bearerToken') {
      token = stagingBearerToken;
    }
  }

  if (token && token !== 'bearerToken' && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  if (options.bodyData) {
    config.body = JSON.stringify(options.bodyData);
  }

  // Logger for debugging API calls in development
  if (__DEV__) {
    console.log(`[API Request] ${config.method || 'GET'} -> ${url}`, {
      headers: Object.fromEntries(headers.entries()),
      body: options.bodyData,
    });
  }

  try {
    const response = await fetch(url, config);
    
    // Parse response as text first, to handle empty responses gracefully
    const responseText = await response.text();
    let responseData: any = {};
    
    if (responseText) {
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { message: responseText };
      }
    }

    if (__DEV__) {
      console.log(`[API Response] ${response.status} <- ${url}`, responseData);
    }

    if (!response.ok) {
      // Extract detailed error message from response body
      const errorMessage = 
        responseData.message || 
        responseData.error || 
        (Array.isArray(responseData.messages) ? responseData.messages.join(', ') : null) ||
        `Request failed with status ${response.status}`;
      
      throw new BuildsureApiError(errorMessage, response.status, responseData);
    }

    return responseData as T;
  } catch (error: any) {
    if (error instanceof BuildsureApiError) {
      throw error;
    }
    
    // Handle network or unexpected exceptions
    if (__DEV__) {
      console.error(`[API Network Error] ${url}`, error);
    }
    
    throw new BuildsureApiError(
      error.message || 'Network connectivity issue. Please check your internet connection.',
      500
    );
  }
}

export const api = {
  get: <T>(endpoint: string, userToken?: string | null) => 
    request<T>(endpoint, { method: 'GET', userToken }),
    
  post: <T>(endpoint: string, bodyData?: any, userToken?: string | null) => 
    request<T>(endpoint, { method: 'POST', bodyData, userToken }),
    
  put: <T>(endpoint: string, bodyData?: any, userToken?: string | null) => 
    request<T>(endpoint, { method: 'PUT', bodyData, userToken }),
    
  delete: <T>(endpoint: string, userToken?: string | null) => 
    request<T>(endpoint, { method: 'DELETE', userToken }),
};
