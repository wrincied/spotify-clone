import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  getAlbums(): Observable<any[]> {
    return this.http.get<any>('http://localhost:3000/api/albums').pipe(
      map((res: any) => {
        if (res.error) {
          throw new Error(res.message || 'Server Error');
        }
        return res.data;  // <--- ВАЖНО
      })
    );
  }
}
