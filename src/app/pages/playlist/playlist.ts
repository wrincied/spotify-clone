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
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { FastAverageColor } from 'fast-average-color';

import { ApiService } from '../../services/ApiService/api';
import { AlbumInterface, SongInterface } from '../../interface/models';
import { SongRow } from '../../components/songRow/songRow';
import { MusicStoreService } from '../../services/music-store/music-store';
import { PlayerService } from '../../services/playerService/player-service';

@Component({
  selector: 'app-playlist',
  standalone: true,
  imports: [CommonModule, SongRow],
  templateUrl: './playlist.html',
  styleUrls: ['./playlist.scss'],
})
export class PlaylistComponent implements OnInit, OnDestroy, AfterViewInit {
  // Состояние компонента [cite: 2025-12-14]
  album: AlbumInterface | null = null;
  gradientColor: string = 'linear-gradient(to bottom, #333, #121212)';
  mainColor: string = '#333';
  isSticky: boolean = false;

  @ViewChild('albumHeaderRef') albumHeaderRef!: ElementRef;
  @Output() playRequest = new EventEmitter<void>();

  // Инъекции сервисов [cite: 2025-12-14]
  public playerService = inject(PlayerService);
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  public musicStore = inject(MusicStoreService);

  private observer?: IntersectionObserver;
  private subs: Subscription = new Subscription();

  currentTrack: SongInterface | null = null;
  isPlayerPlaying: boolean = false;

  ngOnInit() {
    // 1. ПОДПИСКА НА ПАРАМЕТРЫ URL И ЗАГРУЗКА АЛЬБОМА [cite: 2025-12-14]
    this.subs.add(
      this.route.paramMap.subscribe((params) => {
        const id = params.get('id');
        if (!id) return;

        // Сброс старого состояния перед загрузкой нового альбома [cite: 2025-12-14]
        this.isSticky = false;
        this.album = null;

        this.api.getPlaylistById(id).subscribe({
          next: (albumData) => {
            // «Склейка»: получаем полные данные песен из Store [cite: 2025-12-14]
            const allSongs = this.musicStore.currentSongs;

            const enrichedSongs = albumData.songs.map((albumSong: any) => {
              const songId = albumSong.id || albumSong;
              const fullSong = allSongs.find(
                (s) => String(s.id) === String(songId),
              );
              // Возвращаем полную версию или оригинал, если не нашли [cite: 2025-12-14]
              return fullSong || albumSong;
            });

            this.album = {
              ...albumData,
              songs: enrichedSongs.filter((s) => s.title || s.name),
            };

            // Обработка цвета обложки [cite: 2025-12-14]
            if (this.album?.cover) {
              const coverUrl = this.album.cover.startsWith('http')
                ? this.album.cover
                : `http://localhost:3000/${this.album.cover.replace(/^\//, '')}`;
              this.setDominantColor(coverUrl);
            }

            // Важно: Ждем отрисовку @if(album) в DOM и вешаем Observer [cite: 2025-12-14]
            this.cdr.detectChanges();
            this.initObserver();
          },
          error: (err) => console.error('Error fetching album:', err),
        });
      }),
    );

    // 2. ПОДПИСКА НА СТАТУС ПЛЕЕРА [cite: 2025-12-14]
    this.subs.add(
      this.playerService.isPlaying$.subscribe((isPlaying) => {
        this.isPlayerPlaying = isPlaying;
        this.cdr.detectChanges();
      }),
    );

    // 3. ПОДПИСКА НА ТЕКУЩИЙ ТРЕК [cite: 2025-12-14]
    this.subs.add(
      this.playerService.currentTrack$.subscribe((track) => {
        this.currentTrack = track;
        this.cdr.detectChanges();
      }),
    );
  }

  handlePlay(song: SongInterface) {
    if (!this.album || !this.album.songs.length) return;

    const trackIndex = this.album.songs.findIndex(
      (s) => String(s.id) === String(song.id),
    );

    this.playerService.playTrackList(
      this.album.songs,
      trackIndex >= 0 ? trackIndex : 0,
      this.album.cover || '',
    );
  }

  get isAlbumPlaying(): boolean {
    if (!this.album || !this.currentTrack) return false;
    const isTrackInAlbum = this.album.songs.some(
      (s) => String(s.id) === String(this.currentTrack?.id),
    );
    return isTrackInAlbum && this.isPlayerPlaying;
  }

  private setDominantColor(imageUrl: string) {
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

  /**
   * Инициализация IntersectionObserver для Sticky-эффекта [cite: 2025-12-14]
   */
  initObserver() {
    if (this.observer) this.observer.disconnect();

    const scrollContainer =
      document.querySelector('.spotify-main') ||
      document.querySelector('.main-view');

    // Если элемент еще не в DOM (из-за @if), выходим [cite: 2025-12-14]
    if (!this.albumHeaderRef) return;

    const options = {
      root: scrollContainer,
      threshold: 0,
      rootMargin: '-90px 0px 0px 0px', // Учитываем высоту хедера
    };

    this.observer = new IntersectionObserver(([entry]) => {
      // Логика переключения видимости липкого хедера [cite: 2025-12-14]
      const shouldBeSticky =
        !entry.isIntersecting && entry.boundingClientRect.top < 90;

      if (this.isSticky !== shouldBeSticky) {
        this.isSticky = shouldBeSticky;
        this.cdr.detectChanges();
      }
    }, options);

    this.observer.observe(this.albumHeaderRef.nativeElement);
  }

  ngAfterViewInit() {
    // Резервный вызов, если данные загрузились мгновенно [cite: 2025-12-14]
    if (this.album) this.initObserver();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.observer?.disconnect();
  }
}
