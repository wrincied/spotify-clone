import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { Login } from './pages/Auth/login/login';
import { SongComponent } from './pages/song/song';
import { PlaylistComponent } from './pages/playlist/playlist';
import { SearchComponent } from './pages/search/search';
import { Library } from './pages/library/library';
import { CreatePlaylist } from './pages/create-playlist/create-playlist';
import { PageArtistComponent } from './pages/artist-page/artist-page';
import { AdminComponent } from './pages/admin/admin'; // Предполагаемый путь к админке
import { adminGuard } from './guards/admin/admin-guard'; // Наш созданный Guard

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'library', component: Library },
  { path: 'create-playlist', component: CreatePlaylist },
  { path: 'search', component: SearchComponent },
  { path: 'album/:id', component: PlaylistComponent },
  { path: 'album/:collectionId/song/:songId', component: SongComponent },
  { path: 'login', component: Login, data: { noLayout: true } },
  { path: 'artist/:id', component: PageArtistComponent },
  
  // Защищенный маршрут админ-панели [cite: 2025-12-14]
  { 
    path: 'admin', 
    component: AdminComponent, 
    canActivate: [adminGuard], // Проверка прав [cite: 2025-12-14]
    data: { noLayout: true } 
  },

  { path: '**', redirectTo: '' },
];