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
import { NavigationService } from '../../services/navigationService/navigation-service';

@Component({
  selector: 'app-playlist',
  standalone: true,
  imports: [CommonModule, SongRow],
  templateUrl: './playlist.html',
  styleUrls: ['./playlist.scss'],
})
export class PlaylistComponent implements OnInit, OnDestroy, AfterViewInit {
  // Состояние компонента [cite: 2025-12-14]
  song: SongInterface | null = null;
  album: AlbumInterface | null = null;
  gradientColor: string = 'linear-gradient(to bottom, #333, #121212)';
  mainColor: string = '#333';
  isSticky: boolean = false;

  @ViewChild('albumHeaderRef') albumHeaderRef!: ElementRef;
  @Output() playRequest = new EventEmitter<void>();

  // Инъекции сервисов через inject() для Angular 21 [cite: 2025-12-14]
  public playerService = inject(PlayerService);
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  public musicStore = inject(MusicStoreService);
  private nav = inject(NavigationService);

  private observer?: IntersectionObserver;
  private subs: Subscription = new Subscription();

  currentTrack: SongInterface | null = null;
  isPlayerPlaying: boolean = false;

  ngOnInit() {
    // 1. Подписка на параметры URL и загрузка альбома [cite: 2025-12-14]
    this.subs.add(
      this.route.paramMap.subscribe((params) => {
        const id = params.get('id');
        if (!id) return;

        this.isSticky = false;
        this.album = null;

        this.api.getPlaylistById(id).subscribe({
          next: (albumData: AlbumInterface) => {
            const allSongsInStore = this.musicStore.currentSongs();

            // Трансформация: превращаем ID или неполные объекты в SongInterface [cite: 2025-12-14]
            const enrichedSongs: SongInterface[] = albumData.songs.map(
              (albumSong: any) => {
                const songId = albumSong.id || albumSong;
                const fullSong = allSongsInStore.find(
                  (s) => String(s.id) === String(songId),
                );

                // Возвращаем полный объект из стора или создаем минимально валидный [cite: 2025-12-14]
                if (fullSong) return fullSong;

                return typeof albumSong === 'object'
                  ? (albumSong as SongInterface)
                  : ({
                      id: albumSong,
                      title: '',
                      artist: '',
                      url: '',
                      thumbnail: null,
                      duration: 0,
                    } as SongInterface);
              },
            );

            // Фильтруем только те песни, у которых есть название (успешно найденные) [cite: 2025-12-14]
            const finalSongs = enrichedSongs.filter(
              (s): s is SongInterface => !!s.title,
            );

            this.album = { ...albumData, songs: finalSongs };
            this.cdr.detectChanges();
            if (this.album.cover) {
              this.setDominantColor(this.album.cover);
            }

            this.cdr.detectChanges();
            this.initObserver();
          },
          error: (err) => console.error('Error fetching album:', err),
        });
      }),
    );

    // 2. Синхронизация статуса плеера [cite: 2025-12-14]
    this.subs.add(
      this.playerService.isPlaying$.subscribe((isPlaying) => {
        this.isPlayerPlaying = isPlaying;
        this.cdr.detectChanges();
      }),
    );

    // 3. Синхронизация текущего трека [cite: 2025-12-14]
    this.subs.add(
      this.playerService.currentTrack$.subscribe((track) => {
        this.currentTrack = track;
        this.cdr.detectChanges();
      }),
    );
  }

  /**
   * Запуск воспроизведения. Явно приводим songs к SongInterface[] [cite: 2025-12-14]
   */
  handlePlay(song: SongInterface) {
    if (!this.album || !this.album.songs || this.album.songs.length === 0)
      return;

    const songsList = this.album.songs as SongInterface[];
    const trackIndex = songsList.findIndex(
      (s) => String(s.id) === String(song.id),
    );

    this.playerService.playTrackList(
      songsList,
      trackIndex >= 0 ? trackIndex : 0,
      this.album.cover || '',
    );
  }

  /**
   * Проверка, проигрывается ли сейчас какой-либо трек из этого альбома [cite: 2025-12-14]
   */
  get isAlbumPlaying(): boolean {
    if (!this.album || !this.currentTrack || !this.album.songs) return false;

    const songsList = this.album.songs as SongInterface[];
    const isTrackInAlbum = songsList.some(
      (s) => String(s.id) === String(this.currentTrack?.id),
    );

    return isTrackInAlbum && this.isPlayerPlaying;
  }

  onArtistClick(event: Event): void {
    const idToNavigate = this.album?.artistId;
    if (idToNavigate) {
      event.stopPropagation();
      this.nav.goToArtist(idToNavigate);
    }
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

  initObserver() {
    if (this.observer) this.observer.disconnect();

    const scrollContainer =
      document.querySelector('.spotify-main') ||
      document.querySelector('.main-view');
    if (!this.albumHeaderRef) return;

    const options = {
      root: scrollContainer,
      threshold: 0,
      rootMargin: '-90px 0px 0px 0px',
    };

    this.observer = new IntersectionObserver(([entry]) => {
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
    if (this.album) this.initObserver();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.observer?.disconnect();
  }
}
