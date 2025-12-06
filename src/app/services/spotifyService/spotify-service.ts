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

declare const __firebase_config: string;
declare const __app_id: string;
declare const __initial_auth_token: string | undefined;

@Injectable({ providedIn: 'root' })
export class SpotifyService {
  clearSearch() {
    throw new Error('Method not implemented.');
  }private db: any;
  private auth: any;
  private appId: string;
  private user: User | null = null;

  public searchQuery$ = new BehaviorSubject<string>(''); 
  private searchInputSubject = new Subject<string>();

  constructor(private router: Router) {
    this.appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    this.initFirebase();
    this.handleInitialUrl();
    this.setupSearchDebounce();

  }

  private handleInitialUrl() {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const q = urlParams.get('q');
      if (q) this.searchQuery$.next(q);
    }
  }

  private initFirebase() {
    try {
      const config = JSON.parse(__firebase_config);
      const app = initializeApp(config);
      this.auth = getAuth(app);
      this.db = getFirestore(app);
      
      const initAuth = async () => {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
           try { await signInWithCustomToken(this.auth, __initial_auth_token); } 
           catch { await signInAnonymously(this.auth); }
        } else {
           await signInAnonymously(this.auth);
        }
      };
      initAuth();

      onAuthStateChanged(this.auth, (user: any) => {
        this.user = user;
        if (user) this.syncWithCloud(user.uid);
      });
    } catch (e) {
      console.error('Firebase Error', e);
    }
  }

  setSearch(query: string) {
    this.searchInputSubject.next(query);
    this.searchQuery$.next(query);
  }

  private setupSearchDebounce() {
    this.searchInputSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(query => {
      this.updateUrl(query);
      this.saveToCloud(query);
    });
  }

  private updateUrl(query: string) {
    // ВАЖНО: Если query пустой, передаем null, чтобы удалить параметр из URL
    const params = { q: query || null };
    
    this.router.navigate([], { 
        queryParams: params, 
        queryParamsHandling: 'merge', 
        replaceUrl: true 
    });
  }

  private async saveToCloud(query: string) {
    if (!this.user || !this.db) return;
    const ref = doc(this.db, 'artifacts', this.appId, 'users', this.user.uid, 'preferences', 'playback_state');
    try { await setDoc(ref, { lastSearchQuery: query }, { merge: true }); } catch {}
  }

  private syncWithCloud(uid: string) {
    const ref = doc(this.db, 'artifacts', this.appId, 'users', uid, 'preferences', 'playback_state');
    onSnapshot(ref, (snap: any) => {
      if (snap.exists()) {
        const val = snap.data().lastSearchQuery;
        if (val !== undefined && val !== this.searchQuery$.value) {
            const urlQ = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('q') : null;
            if (!urlQ) {
               this.searchQuery$.next(val);
               this.updateUrl(val);
            }
        }
      }
    });
  }
}
