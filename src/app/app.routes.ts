import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { Login } from './pages/Auth/login/login';
import { SongComponent } from './pages/song/song';
import { PlaylistComponent } from './pages/playlist/playlist';
import { SearchComponent } from './pages/search/search';
import { Library } from './pages/home/library/library';
import { CreatePlaylist } from './pages/create-playlist/create-playlist';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'library', component: Library },
  { path: 'create-playlist', component: CreatePlaylist },
  { path: 'search', component: SearchComponent },
  { path: 'album/:id', component: PlaylistComponent },
  { path: 'album/:collectionId/song/:songId', component: SongComponent },
  { path: 'login', component: Login, data: { noLayout: true } },

  { path: '**', redirectTo: '' },
];
