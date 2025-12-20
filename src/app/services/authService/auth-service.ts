// src/app/services/auth.service.ts
import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, of, tap } from 'rxjs';

export interface LoginCredentials {
  username: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly API_URL = 'http://localhost:3000/api/auth';

  isAdmin = signal<boolean>(false);
  isLoaded = signal<boolean>(false); // Флаг окончания проверки

  login(credentials: LoginCredentials) {
    // ИСПРАВЛЕНО: Передаем весь объект credentials (username + password),
    // а не создаем новый объект { password }, который терял username.
    return this.http
      .post<{
        error: boolean;
        message: string;
      }>(`${this.API_URL}/login`, credentials, { withCredentials: true })
      .pipe(
        tap((res) => {
          if (!res.error) this.isAdmin.set(true);
        }),
        catchError((err) => {
          this.isAdmin.set(false);
          throw err;
        }),
      );
  }

  logout() {
    return this.http
      .post(`${this.API_URL}/logout`, {}, { withCredentials: true })
      .subscribe({
        next: () => {
          this.isAdmin.set(false);
          this.router.navigate(['/login']);
        },
      });
  }

  checkAuthStatus() {
    return this.http
      .get<{
        isAdmin: boolean;
      }>(`${this.API_URL}/me`, { withCredentials: true })
      .pipe(
        tap((res) => {
          this.isAdmin.set(res.isAdmin);
          this.isLoaded.set(true);
        }),
        catchError(() => {
          // Если сервер недоступен или ошибка 401, снимаем права админа,
          // но помечаем загрузку завершенной, чтобы снять блокировку UI.
          this.isAdmin.set(false);
          this.isLoaded.set(true);
          return of({ isAdmin: false });
        }),
      );
  }
}
