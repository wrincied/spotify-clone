import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withFetch()),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),

    // ОТКЛЮЧАЕМ HYDRATION ПОЛНОСТЬЮ
    {
      provide: 'ENVIRONMENT_INITIALIZER',
      multi: true,
      useValue: () => {
        (window as any).__NG_HYDRATION__ = false;
      }
    }
  ]
};
