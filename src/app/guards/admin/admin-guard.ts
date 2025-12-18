import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../../services/authService/auth-service';
import { map, of } from 'rxjs';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // СЦЕНАРИЙ 1: Приложение уже загружено и статус известен
  if (authService.isLoaded()) {
    return authService.isAdmin()
      ? true
      : router.createUrlTree(['/login'], {
          queryParams: { returnUrl: state.url },
        });
  }

  // СЦЕНАРИЙ 2: Перезагрузка страницы (F5)
  // Возвращаем поток (Observable), чтобы роутер подождал ответа от сервера
  return authService.checkAuthStatus().pipe(
    map(() => {
      if (authService.isAdmin()) {
        return true; // Сервер подтвердил сессию, пускаем дальше
      }

      // Сервер не подтвердил сессию, отправляем на логин с сохранением пути
      return router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url },
      });
    }),
  );
};
