import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { AlbumInterface } from '../../interface/models';

@Injectable({ providedIn: 'root' })
export class ApiService {

  constructor(private http: HttpClient) { }

  // Получение всех альбомов
  getAlbums(): Observable<any[]> {
    return this.http.get<any>('http://localhost:3000/api/albums').pipe(
      map((res: any) => {
        if (res.error) {
          throw new Error(res.message || 'Server Error');
        }
        return res.data;
      })
    );
  }

  // Получение плейлиста по ID
  getPlaylistById(id: string): Observable<AlbumInterface> {
  return this.http.get<any>(`http://localhost:3000/api/albums/${id}`).pipe(
    map(res => res.data)   // ← ключевой момент
  );
}

}
