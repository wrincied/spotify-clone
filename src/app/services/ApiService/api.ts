import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { AlbumInterface, ArtistInterface } from '../../interface/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  // Используем централизованный URL из конфига 
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Получение всех альбомов
  getAlbums(): Observable<any[]> {
    // Добавляем конкретный путь /albums к базовому URL
    return this.http.get<any>(`${this.apiUrl}/albums`).pipe(
      map((res: any) => {
        if (res.error) {
          throw new Error(res.message || 'Server Error');
        }
        // Возвращаем данные, которые прислал бэкенд
        return res.data;
      }),
    );
  }

  // Получение плейлиста (альбома) по ID
  getPlaylistById(id: string): Observable<AlbumInterface> {
    return this.http
      .get<any>(`${this.apiUrl}/albums/${id}`)
      .pipe(map((res) => res.data));
  }
  getArtistById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/artists/${id}`).pipe(
      map((res) => {
        console.log('Backend Response:', res); // Проверь это в консоли браузера! 
        return res.data; // Возвращаем именно содержимое data 
      }),
    );
  }
}
