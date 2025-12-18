import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/authService/auth-service'; // Путь к вашему сервису

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  // Инъекции зависимостей (Angular 21 style)
  private authService = inject(AuthService);
  private router = inject(Router);

  // Состояния UI через Signals
  public isLoading = signal(false);
  public errorMessage = signal<string | null>(null);

  // Контролы формы
  public userNameFormControl = new FormControl('', [Validators.required]);
  public passwordFormControl = new FormControl('', [Validators.required, Validators.minLength(6)]);
  public userForm!: FormGroup;

  ngOnInit() {
    this.userForm = new FormGroup({
      username: this.userNameFormControl,
      password: this.passwordFormControl
    });
  }

  submit() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    // Извлекаем только пароль, так как наш текущий бэкенд 
    // проверяет админа по хешу пароля
    const { password } = this.userForm.value;

    this.authService.login(password).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/admin']); // Переход в панель управления
      },
      error: (err) => {
        this.isLoading.set(false);
        // Обработка ошибки 401 или проблем с сетью
        this.errorMessage.set(err.error?.message || 'Invalid credentials or server error');
      }
    });
  }
}