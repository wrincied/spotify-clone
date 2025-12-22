import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home';
import { Login } from './features/auth/login/login';
import { Song } from './features/song/song';
import { PlaylistComponent } from './features/playlist/playlist';
import { SearchComponent } from './features/search/search';
import { Library } from './features/library/library';
import { CreatePlaylist } from './features/create-playlist/create-playlist';
import { PageArtistComponent } from './features/artist-page/artist-page';
import { AdminComponent } from './features/admin/admin'; // Предполагаемый путь к админке
import { adminGuard } from './core/guards/admin-guard'; // Наш созданный Guard
import { User } from './features/auth/user/user';
import { Singup } from './features/auth/signup/singup';
export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'library', component: Library },
  { path: 'create-playlist', component: CreatePlaylist },
  { path: 'search', component: SearchComponent },
  { path: 'album/:id', component: PlaylistComponent },
  { path: 'album/:collectionId/song/:songId', component: Song },
  { path: 'login', component: Login, data: { noLayout: true } },
  { path: 'signup', component: Singup, data: { noLayout: true } },
  { path: 'artist/:id', component: PageArtistComponent },
  { path: 'auth', component: User },
  // Защищенный маршрут админ-панели
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [adminGuard],
    data: { noLayout: true },
  },

  { path: '**', redirectTo: '' },
];
