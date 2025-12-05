import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { SongComponent } from './pages/song/song';
import { PlaylistComponent } from './pages/playlist/playlist';


export const routes: Routes = [
    { path: '', component: Home },
    { path: 'login', data: { noLayout: true }, component: Login },
    { path: 'album/:id', component: PlaylistComponent },
    { path: 'album/:collectionId/song/:songId', component: SongComponent },
];
