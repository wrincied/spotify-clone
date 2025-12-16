import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  AfterViewInit,
  ViewChild,
  ElementRef,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { FastAverageColor } from 'fast-average-color';

import { ApiService } from '../../services/ApiService/api';
import { AlbumInterface, SongInterface } from '../../interface/models';
import { SongRow } from '../../components/songRow/songRow';
import { MusicStoreService } from '../../services/music-store/music-store';

@Component({
  selector: 'app-playlist',
  standalone: true,
  imports: [CommonModule, SongRow],
  templateUrl: './playlist.html',
  styleUrls: ['./playlist.scss'],
})
export class PlaylistComponent implements OnInit, OnDestroy, AfterViewInit {
  album: AlbumInterface | null = null;
  gradientColor: string = 'linear-gradient(to bottom, #333, #121212)';
  mainColor: string = '#333';

  @ViewChild('albumHeaderRef') albumHeaderRef!: ElementRef;
  @Output() playRequest = new EventEmitter<void>();

  // УБРАЛИ ЛИШНИЕ @Input, добавили обычные поля
  currentTrack: SongInterface | null = null;
  isPlayerPlaying: boolean = false;

  isSticky: boolean = false;
  private observer?: IntersectionObserver;
  // Единая подписка для чистоты
  private subs: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    public musicStore: MusicStoreService,
  ) {}

  ngOnInit() {
    // 1. ЗАГРУЗКА АЛЬБОМА
    this.route.paramMap.subscribe((params) => {
      // Лучше брать id из params, а не snapshot, чтобы работало при смене ID в URL
      const id = params.get('id'); 
      if (!id) return;

      this.gradientColor = 'linear-gradient(to bottom, #333, #121212)';
      this.mainColor = '#1f1f1f';

      const apiSub = this.api.getPlaylistById(id).subscribe({
        next: (album) => {
          this.album = album;
          if (album.cover) this.setDominantColor(album.cover);
          this.cdr.detectChanges();
          // Перезапускаем observer при смене альбома
          setTimeout(() => this.initObserver(), 0); 
        },
        error: (err) => console.error(err),
      });
      this.subs.add(apiSub);
    });

    // 2. ПОДПИСКА НА СТАТУС ПЛЕЕРА (ВАЖНО!)
    this.subs.add(
      this.musicStore.isPlaying$.subscribe((isPlaying) => {
        this.isPlayerPlaying = isPlaying;
        this.cdr.detectChanges(); // Обновляем UI
      })
    );

    // 3. ПОДПИСКА НА ТЕКУЩИЙ ТРЕК (ВАЖНО!)
    this.subs.add(
      this.musicStore.currentTrack$.subscribe((track) => {
        this.currentTrack = track;
        this.cdr.detectChanges(); // Обновляем UI
      })
    );
  }

  setDominantColor(imageUrl: string) {
    const fac = new FastAverageColor();
    fac
      .getColorAsync(imageUrl)
      .then((color) => {
        this.mainColor = color.hex;
        this.gradientColor = `linear-gradient(to bottom, ${color.hex}, #121212)`;
        this.cdr.detectChanges();
      })
      .catch(() => {
        this.mainColor = '#333';
        this.gradientColor = 'linear-gradient(to bottom, #333, #121212)';
        this.cdr.detectChanges();
      });
  }

  ngAfterViewInit() {
    // Observer запускается внутри подписки API, 
    // но можно оставить метод пустым или перенести логику сюда
  }

  initObserver() {
    if (this.observer) this.observer.disconnect();
    
    // Ищем контейнер скролла. Убедитесь, что класс .spotify-main существует в app.component
    const scrollContainer = document.querySelector('.spotify-main') || document.querySelector('.main-view'); 
    
    if (!scrollContainer || !this.albumHeaderRef) return;

    const options = {
      root: scrollContainer,
      threshold: 0,
      rootMargin: '-70px 0px 0px 0px', // Настройка момента срабатывания
    };

    this.observer = new IntersectionObserver(([entry]) => {
      // Логика: если элемент уехал наверх (top < 64) и перестал пересекаться
      const isHidden = !entry.isIntersecting && entry.boundingClientRect.top < 64;
      
      if (this.isSticky !== isHidden) {
        this.isSticky = isHidden;
        this.cdr.detectChanges();
      }
    }, options);

    this.observer.observe(this.albumHeaderRef.nativeElement);
  }

  ngOnDestroy() {
    this.subs.unsubscribe(); // Отписка от всего сразу (API + Store)
    this.observer?.disconnect();
  }

  handlePlay(song: SongInterface) {
    if (!this.album) return;
    this.musicStore.playOrPause(song, this.album.songs, this.album.cover || '');
  }

  get isAlbumPlaying(): boolean {
    if (!this.album || !this.currentTrack) return false;
    
    // Проверяем, есть ли текущий трек в этом альбоме
    const isTrackInAlbum = this.album.songs.some(
      (s) => String(s.id) === String(this.currentTrack?.id)
    );
    
    // И статус плеера должен быть Playing
    return isTrackInAlbum && this.isPlayerPlaying;
  }
}