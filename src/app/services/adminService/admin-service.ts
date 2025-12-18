// src/app/services/admin.service.ts
import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:3000/api';
  private readonly OPTS = { withCredentials: true };

  // Signals для данных
  artists = signal<any[]>([]);
  songs = signal<any[]>([]);
  albums = signal<any[]>([]);
  categories = signal<any[]>([]);
  logs = signal<string[]>([]);

  loadAll() {
    this.addLog('Starting data refresh...');
    this.fetchData('artists');
    this.fetchData('songs');
    this.fetchData('albums');
    this.fetchData('categories');
  }

  private fetchData(type: string) {
    this.http.get<any>(`${this.API_URL}/${type}`, this.OPTS).subscribe({
      next: (res) => {
        // Защищенное извлечение данных: пробуем res.data, иначе берем сам res [cite: 2025-12-14]
        const items =
          res && res.data ? res.data : Array.isArray(res) ? res : [];

        if (type === 'artists') this.artists.set(items);
        else if (type === 'songs') this.songs.set(items);
        else if (type === 'albums') this.albums.set(items);
        else if (type === 'categories') this.categories.set(items);

        this.addLog(`Loaded ${type}: ${items.length} items`);
      },
      error: (err) => {
        this.addLog(`Error loading ${type}: ${err.message}`);
        console.error(`[AdminService] ${type} error:`, err);
      },
    });
  }
  addLog(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    this.logs.update((prev) =>
      [`[${timestamp}] ${message}`, ...prev].slice(0, 50),
    );
  }
  createItem(type: string, data: any) {
    return this.http.post(`${this.API_URL}/${type}`, data, this.OPTS);
  }

  updateItem(type: string, id: string, data: any) {
    return this.http.put(`${this.API_URL}/${type}/${id}`, data, this.OPTS);
  }

  deleteItem(type: string, id: string) {
    return this.http.delete(`${this.API_URL}/${type}/${id}`, this.OPTS);
  }
}
