import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  signInWithCustomToken,
  User,
} from 'firebase/auth';
import { doc, getFirestore, onSnapshot, setDoc } from 'firebase/firestore';
import { BehaviorSubject, debounceTime, distinctUntilChanged, Subject } from 'rxjs';

// Эти константы пробрасываются из сборки (vite / webpack / angular.json)
declare const __firebase_config: string | undefined;
declare const __app_id: string | undefined;
declare const __initial_auth_token: string | undefined;


@Injectable({ providedIn: 'root' })
export class SpotifyService {
  // ─────────────────────────────────────────────────────────────────────
  // Firebase / служебные поля
  // ─────────────────────────────────────────────────────────────────────
  private db: any;
  private auth: any;
  private appId: string;
  private user: User | null = null;

  // ─────────────────────────────────────────────────────────────────────
  // Глобальное состояние поиска
  //
  // searchQuery$      — текущее значение поиска для всех компонент (TopNav, Search и т.д.)
  // searchInputSubject — "сырое" событие ввода, которое идёт через debounce
  // ─────────────────────────────────────────────────────────────────────
  public searchQuery$ = new BehaviorSubject<string>(''); 
  private searchInputSubject = new Subject<string>();

  constructor(private router: Router) {
    // appId нужен для пути в Firestore
    this.appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    // Инициализация Firebase (если есть конфиг)
    this.initFirebase();

    // Восстанавливаем текст поиска из URL при первой загрузке страницы
    this.handleInitialUrl();

    // Настраиваем debounce для записи в URL и облако
    this.setupSearchDebounce();
  }

  // ─────────────────────────────────────────────────────────────────────
  // ОЧИСТКА ПОИСКА (исправленный метод)
  //
  // Раньше здесь был throw new Error('Method not implemented.'),
  // поэтому ЛЮБОЙ вызов clearSearch() ломал приложение.
  //
  // Сейчас:
  // 1) очищаем текущее значение searchQuery$
  // 2) пробрасываем пустую строку в debounce-пайплайн,
  //    чтобы обнулился ?q в URL и в Firestore.
  // 3) (опционально) возвращаемся на главную страницу.
  // ─────────────────────────────────────────────────────────────────────
  clearSearch() {
    // 1. очищаем состояние для всех подписчиков
    this.searchQuery$.next('');

    // 2. запускаем цепочку debounce → updateUrl('') → saveToCloud('')
    this.searchInputSubject.next('');

    // 3. если нужно гарантированно уйти на главную страницу:
    this.router.navigate(['/'], {
      queryParams: {},
      replaceUrl: true,
    });
  }

  // ─────────────────────────────────────────────────────────────────────
  // ЧТЕНИЕ НАЧАЛЬНОГО ЗНАЧЕНИЯ ИЗ URL (?q=...)
  // Вызывается один раз в конструкторе.
  // Если в строке есть ?q=что-то, кладём это в BehaviorSubject.
  // ─────────────────────────────────────────────────────────────────────
  private handleInitialUrl() {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const q = urlParams.get('q');
      if (q) this.searchQuery$.next(q);
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // ИНИЦИАЛИЗАЦИЯ FIREBASE (Auth + Firestore)
  // Если __firebase_config не определён / битый, ловим ошибку и просто логируем.
  // ─────────────────────────────────────────────────────────────────────
  private initFirebase() {
    // КРИТИЧЕСКАЯ ПРОВЕРКА:
    // если конфиг не подкинули (локальная разработка) —
    // просто выходим и не трогаем Firebase.
    if (typeof __firebase_config === 'undefined' || !__firebase_config) {
      console.warn('[SpotifyService] Firebase config is missing; Firebase init is skipped.');
      return;
    }

    try {
      // Парсим JSON-строку конфига Firebase
      const config = JSON.parse(__firebase_config);
      const app = initializeApp(config);

      this.auth = getAuth(app);
      this.db = getFirestore(app);

      // Настройка авторизации
      const initAuth = async () => {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          try {
            await signInWithCustomToken(this.auth, __initial_auth_token);
          } catch {
            await signInAnonymously(this.auth);
          }
        } else {
          await signInAnonymously(this.auth);
        }
      };

      initAuth();

      // Подписка на изменение auth-состояния
      onAuthStateChanged(this.auth, (user: any) => {
        this.user = user;
        if (user) {
          this.syncWithCloud(user.uid);
        }
      });
    } catch (e) {
      console.error('[SpotifyService] Firebase init error:', e);
      // В любом случае, если Firebase не поднялся, приложение продолжит жить без облака
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // Публичный метод: установить строку поиска
  //
  // Вызывается из TopNav при каждом вводе символа.
  // 1) мгновенно обновляет searchQuery$ → UI реагирует без задержки
  // 2) отправляет значение в Subject → там debounce, и только потом
  //    меняется URL и Firestore.
  // ─────────────────────────────────────────────────────────────────────
  setSearch(query: string) {
    this.searchInputSubject.next(query);
    this.searchQuery$.next(query);
  }

  // ─────────────────────────────────────────────────────────────────────
  // DEBOUNCE ДЛЯ ЗАПИСИ В URL И FIRESTORE
  //
  // Здесь мы "подписываемся" на сырые вводы:
  //  - ждём 500 мс без изменений
  //  - игнорируем одинаковые подряд значения
  //  - потом уже дергаем updateUrl + saveToCloud
  // ─────────────────────────────────────────────────────────────────────
  private setupSearchDebounce() {
    this.searchInputSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(query => {
      this.updateUrl(query);
      this.saveToCloud(query);
    });
  }

  // ─────────────────────────────────────────────────────────────────────
  // ОБНОВЛЕНИЕ URL
  //
  // Мы не меняем path, а только queryParams.
  // Если query пустой → передаём null, Angular удалит параметр ?q.
  // ─────────────────────────────────────────────────────────────────────
  private updateUrl(query: string) {
    const params = { q: query || null };
    
    this.router.navigate([], { 
      queryParams: params, 
      queryParamsHandling: 'merge', 
      replaceUrl: true 
    });
  }

  // ─────────────────────────────────────────────────────────────────────
  // СОХРАНЕНИЕ ПОИСКА В FIRESTORE
  // ─────────────────────────────────────────────────────────────────────
  private async saveToCloud(query: string) {
    if (!this.user || !this.db) return;

    const ref = doc(
      this.db,
      'artifacts',
      this.appId,
      'users',
      this.user.uid,
      'preferences',
      'playback_state'
    );

    try {
      await setDoc(ref, { lastSearchQuery: query }, { merge: true });
    } catch {
      // здесь можно залогировать, если нужно
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // СИНХРОНИЗАЦИЯ СОСТОЯНИЯ С ОБЛАКОМ
  //
  // Слушаем документ playback_state, если там есть lastSearchQuery:
  //  - если в URL сейчас НЕТ ?q, то поднимаем значение из облака,
  //    чтобы восстановить поиск (например, между устройствами).
  // ─────────────────────────────────────────────────────────────────────
  private syncWithCloud(uid: string) {
    const ref = doc(
      this.db,
      'artifacts',
      this.appId,
      'users',
      uid,
      'preferences',
      'playback_state'
    );

    onSnapshot(ref, (snap: any) => {
      if (!snap.exists()) return;

      const val = snap.data().lastSearchQuery;

      if (val !== undefined && val !== this.searchQuery$.value) {
        const urlQ =
          typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search).get('q')
            : null;

        // Приоритет у URL: если ?q уже есть, ничего не трогаем.
        if (!urlQ) {
          this.searchQuery$.next(val);
          this.updateUrl(val);
        }
      }
    });
  }
}
