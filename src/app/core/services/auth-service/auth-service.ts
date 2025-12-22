import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, of, tap, finalize } from 'rxjs';
import { environment } from '../../../../environments/environment'; // Always import the base environment 

export interface LoginCredentials {
  username: string;
  password: string;
}

// Define explicit interfaces for API responses
interface LoginResponse {
  error: boolean;
  message: string;
}

interface AuthStatusResponse {
  isAdmin: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  // Construct API URL from environment config 
  private readonly API_URL = `${environment.apiUrl}/auth`;

  // Signals for reactive state management
  public isAdmin = signal<boolean>(false);
  public isLoaded = signal<boolean>(false); // Flag indicating auth check completion

  /**
   * Authenticates the user with the backend.
   */
  login(credentials: LoginCredentials) {
    return this.http
      .post<LoginResponse>(`${this.API_URL}/login`, credentials, { withCredentials: true })
      .pipe(
        tap((res) => {
          if (!res.error) {
            this.isAdmin.set(true);
          }
        }),
        catchError((err) => {
          this.isAdmin.set(false);
          throw err; // Re-throw to handle UI errors in the component
        })
      );
  }

  /**
   * Logs out the user and clears state.
   * Handles server-side logout first, then cleans up client state.
   */
  logout() {
    return this.http
      .post(`${this.API_URL}/logout`, {}, { withCredentials: true })
      .pipe(
        // Ensure client cleanup happens even if server returns an error (e.g., 401)
        catchError((err) => {
          console.warn('Logout error (session might be expired):', err);
          return of(null);
        }),
        finalize(() => {
          this.isAdmin.set(false);
          this.router.navigate(['/login']);
        })
      )
      .subscribe();
  }

  /**
   * Checks if the user is currently authenticated (on app load).
   */
  checkAuthStatus() {
    return this.http
      .get<AuthStatusResponse>(`${this.API_URL}/me`, { withCredentials: true })
      .pipe(
        tap((res) => {
          this.isAdmin.set(res.isAdmin);
          this.isLoaded.set(true);
        }),
        catchError(() => {
          // If server is unreachable or 401, treat as not logged in.
          // Mark as loaded to unblock the UI.
          this.isAdmin.set(false);
          this.isLoaded.set(true);
          return of({ isAdmin: false });
        })
      );
  }
}