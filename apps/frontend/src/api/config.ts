// src/api/config.ts
// Configurazione centralizzata per le API

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Classe per errori API con status code
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Client HTTP centralizzato per tutte le chiamate API
 */
class ApiClient {
  private baseUrl = API_BASE_URL;

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `Errore ${response.status}`;
      let errorData: unknown;

      try {
        errorData = await response.json();
        if (typeof errorData === 'object' && errorData !== null) {
          const err = errorData as { message?: string | string[] };
          if (Array.isArray(err.message)) {
            errorMessage = err.message.join(', ');
          } else if (err.message) {
            errorMessage = err.message;
          }
        }
      } catch {
        errorMessage = await response.text();
      }

      throw new ApiError(response.status, errorMessage, errorData);
    }

    // Se 204 No Content, ritorna null
    if (response.status === 204) {
      return null as T;
    }

    return response.json();
  }

  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value);
        }
      });
    }

    const response = await fetch(url.toString());
    return this.handleResponse<T>(response);
  }

  async post<T>(path: string, data?: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  async put<T>(path: string, data?: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  async patch<T>(path: string, data?: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  async delete<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE',
    });
    return this.handleResponse<T>(response);
  }
}

// Istanza singleton
export const api = new ApiClient();