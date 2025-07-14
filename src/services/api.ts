// API Client Configuration and Base Service
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export class ApiClient {
  private static baseURL = API_BASE_URL;
  
  private static getAuthHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  private static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // If JSON parsing fails, use the default error message
      }
      
      throw new ApiError(errorMessage, response.status);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    
    return response.text() as unknown as T;
  }

  static async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    
    return this.handleResponse<T>(response);
  }

  static async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
    
    return this.handleResponse<T>(response);
  }

  static async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
    
    return this.handleResponse<T>(response);
  }

  static async patch<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
    
    return this.handleResponse<T>(response);
  }

  static async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    
    return this.handleResponse<T>(response);
  }

  // Utility method to check if token is expired
  static isTokenExpired(): boolean {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }

  // Utility method to refresh token
  static async refreshToken(): Promise<boolean> {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access_token', data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem('refresh_token', data.refreshToken);
        }
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    return false;
  }

  // Enhanced request method with automatic token refresh
  static async authenticatedRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    data?: any
  ): Promise<T> {
    console.log(`🌐 authenticatedRequest: ${method} ${endpoint}`, data ? { data } : '');
    
    // Check if token is expired and try to refresh
    if (this.isTokenExpired()) {
      console.log('🔑 Token expired, trying to refresh...');
      const refreshed = await this.refreshToken();
      if (!refreshed) {
        console.log('❌ Token refresh failed, redirecting to login');
        // Redirect to login or throw auth error
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
        throw new ApiError('Authentication required', 401);
      }
      console.log('✅ Token refreshed successfully');
    }

    try {
      let result: T;
      switch (method) {
        case 'GET':
          result = await this.get<T>(endpoint);
          break;
        case 'POST':
          result = await this.post<T>(endpoint, data);
          break;
        case 'PUT':
          result = await this.put<T>(endpoint, data);
          break;
        case 'PATCH':
          result = await this.patch<T>(endpoint, data);
          break;
        case 'DELETE':
          result = await this.delete<T>(endpoint);
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
      console.log(`✅ authenticatedRequest success: ${method} ${endpoint}`, result);
      return result;
    } catch (error) {
      console.error(`❌ authenticatedRequest error: ${method} ${endpoint}`, error);
      throw error;
    }
  }
}
