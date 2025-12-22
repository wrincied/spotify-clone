import {
  bootstrapApplication,
  provideClientHydration,
} from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
console.log(
  `%c App running in ${environment.production ? 'PRODUCTION' : 'DEVELOPMENT'} `,
  `background: ${environment.production ? '#e91e63' : '#1db954'};,
  color: #fff; font-weight: bold; padding: 2px 4px; border-radius: 3px;`);