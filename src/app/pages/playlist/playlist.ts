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
  album: AlbumInterface | null = null;
  gradientColor: string = 'linear-gradient(to bottom, #333, #121212)';
  mainColor: string = '#333';

  @ViewChild('albumHeaderRef') albumHeaderRef!: ElementRef;
  @Output() playRequest = new EventEmitter<void>();

  // Внедряем синглтон-сервис
  public playerService = inject(PlayerService);

  currentTrack: SongInterface | null = null;
  isPlayerPlaying: boolean = false;

  isSticky: boolean = false;
  private observer?: IntersectionObserver;
  private subs: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    public musicStore: MusicStoreService, // Только для данных альбомов
  ) {}

  ngOnInit() {
    // 1. ЗАГРУЗКА АЛЬБОМА
    this.subs.add(
      this.route.paramMap.subscribe((params) => {
        const id = params.get('id');
        if (!id) return;

        this.gradientColor = 'linear-gradient(to bottom, #333, #121212)';
        this.mainColor = '#1f1f1f';

        this.api.getPlaylistById(id).subscribe({
          next: (album) => {
            this.album = album;
            // Формируем корректный URL для FastAverageColor
            if (album.cover) {
              const coverUrl = album.cover.startsWith('http')
                ? album.cover
                : `http://localhost:3000/${album.cover.replace(/^\//, '')}`;
              this.setDominantColor(coverUrl);
            }
            this.cdr.detectChanges();
            setTimeout(() => this.initObserver(), 0);
          },
          error: (err) => console.error(err),
        });
      }),
    );

    // 2. ПОДПИСКА НА СТАТУС ПЛЕЕРА (ЕДИНЫЙ ИСТОЧНИК)
    this.subs.add(
      this.playerService.isPlaying$.subscribe((isPlaying) => {
        this.isPlayerPlaying = isPlaying;
        this.cdr.detectChanges();
      }),
    );

    // 3. ПОДПИСКА НА ТЕКУЩИЙ ТРЕК (ЕДИНЫЙ ИСТОЧНИК)
    this.subs.add(
      this.playerService.currentTrack$.subscribe((track) => {
        this.currentTrack = track;
        this.cdr.detectChanges();
      }),
    );
  }

  handlePlay(song: SongInterface) {
    if (!this.album) return;

    // Передаем список песен, индекс текущей и обложку альбома для контекста
    this.playerService.playTrackList(
      this.album.songs,
      this.album.songs.findIndex((s) => String(s.id) === String(song.id)),
      this.album.cover || '',
    );
  }

  get isAlbumPlaying(): boolean {
    if (!this.album || !this.currentTrack) return false;

    // Проверяем принадлежность трека к текущему альбому через ID
    const isTrackInAlbum = this.album.songs.some(
      (s) => String(s.id) === String(this.currentTrack?.id),
    );

    return isTrackInAlbum && this.isPlayerPlaying;
  }

  // --- Вспомогательные методы ---

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

  initObserver() {
    if (this.observer) this.observer.disconnect();
    const scrollContainer =
      document.querySelector('.spotify-main') ||
      document.querySelector('.main-view');
    if (!scrollContainer || !this.albumHeaderRef) return;

    const options = {
      root: scrollContainer,
      threshold: 0,
      rootMargin: '-90px 0px 0px 0px',
    };

    this.observer = new IntersectionObserver(([entry]) => {
      const isHidden =
        !entry.isIntersecting && entry.boundingClientRect.top < 64;
      if (this.isSticky !== isHidden) {
        this.isSticky = isHidden;
        this.cdr.detectChanges();
      }
    }, options);
    this.observer.observe(this.albumHeaderRef.nativeElement);
  }

  ngAfterViewInit() {}

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.observer?.disconnect();
  }
}
