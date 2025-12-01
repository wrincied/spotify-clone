import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AlbumService {

  private API_URL = 'http://localhost:3000/api/albums';

  constructor(private http: HttpClient) { }

  getAlbums(): Observable<any[]> {
    console.log('[AlbumService] → GET', this.API_URL);

    return new Observable(observer => {
      this.http.get<any[]>(this.API_URL).subscribe({
        next: (response) => {
          console.log('[AlbumService] ← Response:', response);
          observer.next(response);
          observer.complete();
        },
        error: (error) => {
          console.error('[AlbumService] ❌ Error:', error);
          observer.error(error);
        }
      });
    });
  }
}
