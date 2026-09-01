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
  _isRetry?: boolean;
}

let refreshPromise: Promise<string | null> | null = null;

/**
 * Execute Token Refresh (Singleton Promise to prevent duplicate refresh calls)
 */
export async function executeRefreshToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const refreshToken = await storage.getItem('buildsure_refresh_token');
      if (!refreshToken) {
        if (__DEV__) {
          console.warn('[API Client] No refresh token available in storage.');
        }
        return null;
      }

      const refreshUrl = `${BASE_URL}/auth/refresh-token`;
      if (__DEV__) {
        console.log(`[API Request] POST (Auto Refresh Token) -> ${refreshUrl}`);
      }

      const res = await fetch(refreshUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const responseData = await res.json().catch(() => ({}));

      if (__DEV__) {
        console.log(`[API Response] ${res.status} <- ${refreshUrl}`, responseData);
      }

      const newAccessToken = responseData?.data?.accessToken || responseData?.accessToken;
      const newRefreshToken = responseData?.data?.refreshToken || responseData?.refreshToken || refreshToken;

      if (res.ok && newAccessToken) {
        await storage.setItem('buildsure_auth_token', newAccessToken);
        await storage.setItem('buildsure_refresh_token', newRefreshToken);
        setStagingBearerToken(newAccessToken);
        return newAccessToken;
      }

      return null;
    } catch (err) {
      if (__DEV__) {
        console.error('[API Client] Token refresh failed:', err);
      }
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Standard HTTP Request Wrapper
 */
async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  
  // Set up standard headers
  const headers = new Headers(options.headers || {});
  const isFormData = typeof FormData !== 'undefined' && options.bodyData instanceof FormData;
  
  if (!isFormData && !headers.has('Content-Type')) {
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
    if (isFormData) {
      config.body = options.bodyData;
    } else {
      config.body = JSON.stringify(options.bodyData);
    }
  }

  // Logger for debugging API calls in development
  if (__DEV__) {
    console.log(`[API Request] ${config.method || 'GET'} -> ${url}`, {
      headers: Object.fromEntries(headers.entries()),
      body: isFormData ? '[FormData]' : options.bodyData,
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

    // Handle 401 Unauthorized / Token Expiration by attempting automatic refresh
    if (
      response.status === 401 &&
      !options._isRetry &&
      !endpoint.includes('/auth/refresh-token') &&
      !endpoint.includes('/auth/signin') &&
      !endpoint.includes('/auth/signup')
    ) {
      if (__DEV__) {
        console.log(`[API 401 Interceptor] Access token expired on ${endpoint}. Refreshing token...`);
      }

      const refreshedAccessToken = await executeRefreshToken();
      if (refreshedAccessToken) {
        if (__DEV__) {
          console.log(`[API 401 Interceptor] Token refreshed! Retrying ${endpoint}...`);
        }
        return await request<T>(endpoint, {
          ...options,
          userToken: refreshedAccessToken,
          _isRetry: true,
        });
      }
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

/**
 * XMLHttpRequest-based FormData wrapper to bypass fetch Request wrapper
 * issues with React Native custom FormData objects.
 */
export function uploadForm<T>(
  endpoint: string,
  formData: FormData,
  token?: string | null,
  isRetry: boolean = false,
  method: 'POST' | 'PUT' = 'POST'
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    try {
      const url = `${BASE_URL}${endpoint}`;
      const xhr = new XMLHttpRequest();

      xhr.open(method, url);

      let authToken = token;
      if (!authToken || authToken === 'bearerToken') {
        const savedToken = await storage.getItem('buildsure_auth_token');
        if (savedToken) {
          authToken = savedToken;
        } else if (stagingBearerToken && stagingBearerToken !== 'bearerToken') {
          authToken = stagingBearerToken;
        }
      }

      if (authToken && authToken !== 'bearerToken') {
        xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
      }
      xhr.setRequestHeader('Accept', 'application/json');

      xhr.onload = async () => {
        let responseData: any = {};
        try {
          responseData = JSON.parse(xhr.responseText);
        } catch {
          responseData = { message: xhr.responseText };
        }

        if (xhr.status >= 200 && xhr.status < 300) {
          if (__DEV__) {
            console.log(`[API Response] ${xhr.status} <- ${url}`, responseData);
          }
          resolve(responseData as T);
        } else if (xhr.status === 401 && !isRetry && !endpoint.includes('/auth/refresh-token')) {
          if (__DEV__) {
            console.log(`[API 401 Interceptor FormData] Token expired on ${endpoint}. Refreshing...`);
          }
          const refreshedAccessToken = await executeRefreshToken();
          if (refreshedAccessToken) {
            try {
              const retryRes = await uploadForm<T>(endpoint, formData, refreshedAccessToken, true, method);
              resolve(retryRes);
            } catch (retryErr) {
              reject(retryErr);
            }
          } else {
            const errorMessage =
              responseData.message ||
              responseData.error ||
              `Request failed with status ${xhr.status}`;
            reject(new BuildsureApiError(errorMessage, xhr.status, responseData));
          }
        } else {
          const errorMessage =
            responseData.message ||
            responseData.error ||
            (Array.isArray(responseData.messages) ? responseData.messages.join(', ') : null) ||
            `Request failed with status ${xhr.status}`;

          reject(new BuildsureApiError(errorMessage, xhr.status, responseData));
        }
      };

      xhr.onerror = () => {
        reject(new BuildsureApiError('Network connectivity issue. Please check your internet connection.', 500));
      };

      if (__DEV__) {
        console.log(`[API Request] ${method} (FormData via XHR) -> ${url}`);
      }

      xhr.send(formData as any);
    } catch (err: any) {
      reject(new BuildsureApiError(err.message || 'Failed to upload form data', 500));
    }
  });
}

export const api = {
  get: <T>(endpoint: string, userToken?: string | null) => 
    request<T>(endpoint, { method: 'GET', userToken }),
    
  post: <T>(endpoint: string, bodyData?: any, userToken?: string | null) => 
    request<T>(endpoint, { method: 'POST', bodyData, userToken }),

  postForm: <T>(endpoint: string, formData: FormData, userToken?: string | null) => 
    uploadForm<T>(endpoint, formData, userToken, false, 'POST'),
    
  put: <T>(endpoint: string, bodyData?: any, userToken?: string | null) => 
    request<T>(endpoint, { method: 'PUT', bodyData, userToken }),

  putForm: <T>(endpoint: string, formData: FormData, userToken?: string | null) => 
    uploadForm<T>(endpoint, formData, userToken, false, 'PUT'),

  patch: <T>(endpoint: string, bodyData?: any, userToken?: string | null) => 
    request<T>(endpoint, { method: 'PATCH', bodyData, userToken }),
    
  delete: <T>(endpoint: string, userToken?: string | null) => 
    request<T>(endpoint, { method: 'DELETE', userToken }),
};
