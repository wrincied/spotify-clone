import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, delay } from 'rxjs/operators';
import {
  ArtistInterface,
  SongInterface,
  AlbumInterface,
} from '../../interface/models'; // Проверь путь к интерфейсам

@Injectable({
  providedIn: 'root',
})
export class ArtistService {
  private http = inject(HttpClient);

  // URL к нашему будущему Node.js серверу
  private apiUrl = '/api';

  // 1. Получить профиль артиста
  getArtist(id: string): Observable<ArtistInterface> {
    return this.http
      .get<ArtistInterface>(`${this.apiUrl}/artists/${id}`)
      .pipe(catchError(this.handleError));
  }

  // 2. Получить топ треки
  getTopTracks(id: string): Observable<SongInterface[]> {
    return this.http
      .get<SongInterface[]>(`${this.apiUrl}/artists/${id}/top-tracks`)
      .pipe(catchError(this.handleError));
  }

  // 3. Получить альбомы
  getAlbums(id: string): Observable<AlbumInterface[]> {
    return this.http
      .get<AlbumInterface[]>(`${this.apiUrl}/artists/${id}/albums`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any) {
    console.error('ArtistService API Error:', error);
    return throwError(() => new Error('Artist API Request Failed'));
  }
  
}
