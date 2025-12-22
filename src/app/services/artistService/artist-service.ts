import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  ArtistInterface,
  SongInterface,
  AlbumInterface,
} from '../../interface/models'; // Проверь путь к интерфейсам
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ArtistService {
  private http = inject(HttpClient);

  // URL к нашему будущему Node.js серверу
  // ВРЕМЕННО: Пишем полный адрес, чтобы обойти проблемы с Proxy
  private API_URL = environment.apiUrl

  // 1. Получить профиль артиста
  getArtist(id: string): Observable<ArtistInterface> {
    // Сервер возвращает { error: false, data: Artist }, поэтому используем any для ответа
    return this.http.get<any>(`${this.API_URL}/artists/${id}`).pipe(
      map((response) => response.data), // <--- 2. ДОСТАЕМ ДАННЫЕ ИЗ ОБЕРТКИ
      catchError(this.handleError),
    );
  }
  // 2. Получить топ треки
  getTopTracks(id: string): Observable<SongInterface[]> {
    return this.http
      .get<SongInterface[]>(`${this.API_URL}/artists/${id}/top-tracks`)
      .pipe(catchError(this.handleError));
  }

  // 3. Получить альбомы
  getAlbums(id: string): Observable<AlbumInterface[]> {
    return this.http
      .get<AlbumInterface[]>(`${this.API_URL}/artists/${id}/albums`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any) {
    console.error('ArtistService API Error:', error);
    return throwError(() => new Error('Artist API Request Failed'));
  }
}
