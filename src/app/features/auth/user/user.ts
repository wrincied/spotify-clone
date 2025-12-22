import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user',
  imports: [],
  templateUrl: './user.html',
  styleUrl: './user.scss',
})
export class User {
  private router = inject(Router);

  onSignUp() {
    // Навигация на твой будущий роут регистрации
    this.router.navigate(['/signup']);
  }
  onLogin() {
    // Навигация на твой будущий роут регистрации
    this.router.navigate(['/login']);
  }
}
