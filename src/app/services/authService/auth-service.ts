// src/app/services/auth.service.ts
import { inject, Injectable, signal, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, of, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly API_URL = 'http://localhost:3000/api/auth';

  isAdmin = signal<boolean>(false);
  isLoaded = signal<boolean>(false); // Флаг окончания проверки

  login(password: string) {
    return this.http
      .post<{
        error: boolean;
        message: string;
      }>(`${this.API_URL}/login`, { password }, { withCredentials: true })
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
          // Если сервер недоступен, мы всё равно помечаем загрузку как "оконченную" [cite: 2025-12-14]
          this.isAdmin.set(false);
          this.isLoaded.set(true);
          return of({ isAdmin: false }); // Возвращаем объект, чтобы приложение продолжило загрузку
        }),
      );
  }
}
