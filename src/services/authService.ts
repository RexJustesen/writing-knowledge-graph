import { ApiClient, ApiResponse } from './api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    username: string;
    isActive: boolean;
    createdAt: string;
    lastLoginAt?: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken?: string;
}

export class AuthService {
  private static readonly STORAGE_KEYS = {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    USER: 'user_data',
    IS_AUTHENTICATED: 'is_authenticated'
  };

  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await ApiClient.post<LoginResponse>('/api/auth/login', credentials);
    
    // Store tokens and user data
    this.storeAuthData(response);
    
    return response;
  }

  static async register(userData: RegisterRequest): Promise<LoginResponse> {
    const response = await ApiClient.post<LoginResponse>('/api/auth/register', userData);
    
    // Store tokens and user data
    this.storeAuthData(response);
    
    return response;
  }

  static async logout(): Promise<void> {
    try {
      // Call logout endpoint to invalidate tokens on server
      await ApiClient.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Always clear local storage
      this.clearAuthData();
    }
  }

  static async refreshToken(): Promise<RefreshTokenResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await ApiClient.post<RefreshTokenResponse>('/api/auth/refresh', {
      refreshToken
    });

    // Update stored tokens
    localStorage.setItem(this.STORAGE_KEYS.ACCESS_TOKEN, response.accessToken);
    if (response.refreshToken) {
      localStorage.setItem(this.STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
    }

    return response;
  }

  static getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.STORAGE_KEYS.ACCESS_TOKEN);
  }

  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.STORAGE_KEYS.REFRESH_TOKEN);
  }

  static getCurrentUser(): LoginResponse['user'] | null {
    if (typeof window === 'undefined') return null;
    
    const userData = localStorage.getItem(this.STORAGE_KEYS.USER);
    if (!userData) return null;

    try {
      return JSON.parse(userData);
    } catch {
      return null;
    }
  }

  static isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    
    const token = this.getAccessToken();
    const isAuth = localStorage.getItem(this.STORAGE_KEYS.IS_AUTHENTICATED);
    
    return !!(token && isAuth === 'true');
  }

  static isTokenExpired(): boolean {
    const token = this.getAccessToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }

  private static storeAuthData(authResponse: LoginResponse): void {
    if (typeof window === 'undefined') return;

    localStorage.setItem(this.STORAGE_KEYS.ACCESS_TOKEN, authResponse.accessToken);
    localStorage.setItem(this.STORAGE_KEYS.REFRESH_TOKEN, authResponse.refreshToken);
    localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(authResponse.user));
    localStorage.setItem(this.STORAGE_KEYS.IS_AUTHENTICATED, 'true');
  }

  private static clearAuthData(): void {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(this.STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(this.STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(this.STORAGE_KEYS.USER);
    localStorage.removeItem(this.STORAGE_KEYS.IS_AUTHENTICATED);
  }

  // Utility method to get user ID
  static getCurrentUserId(): string | null {
    const user = this.getCurrentUser();
    return user?.id || null;
  }

  // Utility method to check if user has valid session
  static async validateSession(): Promise<boolean> {
    if (!this.isAuthenticated()) return false;

    if (this.isTokenExpired()) {
      try {
        await this.refreshToken();
        return true;
      } catch {
        this.clearAuthData();
        return false;
      }
    }

    return true;
  }
}
