import {
  bootstrapApplication,
  provideClientHydration,
} from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { enableProdMode, isDevMode } from '@angular/core';
import { App } from './app/app';
import { environment } from './environments/environment';
if (environment.production) {
  enableProdMode();
  // Переопределяем функции консоли пустышками
  window.console.log = () => {};
  window.console.debug = () => {};
  window.console.info = () => {};
  // console.error и console.warn лучше оставить для отладки критических ошибок
}
bootstrapApplication(App, appConfig).catch((err) => console.error(err));
console.log(
  `%c App running in ${environment.production ? 'PRODUCTION' : 'DEVELOPMENT'} `,
  `background: ${environment.production ? '#e91e63' : '#1db954'};,
  color: #fff; font-weight: bold; padding: 2px 4px; border-radius: 3px;`);