import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import {
  AlbumInterface,
  CategoryInterface,
} from '../../interface/models';

@Injectable({ providedIn: 'root' })
export class MusicStoreService {
  // Используем современный способ инъекции через inject()
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api';

  // ==========================================
  // 📦 DATA STATE (Только контент)
  // ==========================================
  
  // Хранилище всех доступных альбомов
  private albumsSubject = new BehaviorSubject<AlbumInterface[]>([]);
  public albums$: Observable<AlbumInterface[]> = this.albumsSubject.asObservable();

  // Хранилище всех категорий (плейлистов/жанров)
  private categoriesSubject = new BehaviorSubject<CategoryInterface[]>([]);
  public categories$: Observable<CategoryInterface[]> = this.categoriesSubject.asObservable();

  constructor() {
    // Автоматическая загрузка данных при инициализации приложения
    this.loadAlbums();
    this.loadCategories();
  }

  // --- ГЕТТЕРЫ (для синхронного получения данных в компонентах) ---
  
  get currentAlbums(): AlbumInterface[] {
    return this.albumsSubject.value;
  }

  get currentCategories(): CategoryInterface[] {
    return this.categoriesSubject.value;
  }

  // ==========================================
  // 🚀 HTTP LOGIC
  // ==========================================

  /**
   * Загрузка списка всех альбомов с бэкенда
   */
  loadAlbums() {
    this.http
      .get<{ error: boolean; data: AlbumInterface[] }>(`${this.apiUrl}/albums`)
      .pipe(
        map((response) => response.data || []) // Извлекаем массив данных из обертки API
      )
      .subscribe((data) => this.albumsSubject.next(data));
  }

  /**
   * Загрузка списка категорий (жанров/настроений)
   */
  loadCategories() {
    this.http
      .get<{ error: boolean; data: CategoryInterface[] }>(`${this.apiUrl}/categories`)
      .pipe(
        map((response) => response.data || [])
      )
      .subscribe((data) => this.categoriesSubject.next(data));
  }
}