import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth-service/auth-service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Состояния через Signals
  public isLoading = signal(false);
  public errorMessage = signal<string | null>(null);

  // Форма с использованием строго типизированных контролов (NonNullable)
  public userForm = new FormGroup({
    username: new FormControl('', {
      validators: [Validators.required],
      nonNullable: true,
    }),
    password: new FormControl('', {
      validators: [Validators.required, Validators.minLength(6)],
      nonNullable: true,
    }),
  });

  // Геттеры для краткости в шаблоне
  get username() {
    return this.userForm.controls.username;
  }
  get password() {
    return this.userForm.controls.password;
  }

  submit() {
    // 1. Проверка валидности перед отправкой
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    // 2. Получаем объект { username, password }
    const credentials = this.userForm.getRawValue();

    // 3. Отправляем полный объект на бэкенд
    this.authService.login(credentials).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/admin']);
      },
      error: (err) => {
        this.isLoading.set(false);
        // Безопасное сообщение об ошибке (не уточняем, что именно неверно)
        this.errorMessage.set('Invalid username or password');

        // Логируем ошибку только для разработки (в проде желательно убрать или заменить на логгер)
        console.error('[LOGIN_ERROR]', err);
      },
    });
  }
}
