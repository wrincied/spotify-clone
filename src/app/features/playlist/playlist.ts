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

import { ApiService } from '../../core/services/Api-service/api';
import { AlbumInterface, SongInterface } from '../../core/models/models';
import { SongRow } from '../../shared/components/song-row/songRow';
import { MusicStoreService } from '../../core/services/music-store-service/music-store';
import { PlayerService } from '../../core/services/player-service/player-service';
import { NavigationService } from '../../core/services/navigation-service/navigation-service';

@Component({
  selector: 'app-playlist',
  standalone: true,
  imports: [CommonModule, SongRow],
  templateUrl: './playlist.html',
  styleUrls: ['./playlist.scss'],
})
export class PlaylistComponent implements OnInit, OnDestroy, AfterViewInit {
  // Состояние компонента
  song: SongInterface | null = null;
  album: AlbumInterface | null = null;
  gradientColor: string = 'linear-gradient(to bottom, #333, #121212)';
  mainColor: string = '#333';
  isSticky: boolean = false;

  @ViewChild('albumHeaderRef') albumHeaderRef!: ElementRef;
  @Output() playRequest = new EventEmitter<void>();

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
    // 1. Загрузка данных (без изменений, твой код был ок)
    this.subs.add(
      this.route.paramMap.subscribe((params) => {
        const id = params.get('id');
        if (!id) return;

        this.isSticky = false;
        this.album = null;

        this.api.getPlaylistById(id).subscribe({
          next: (albumData: AlbumInterface) => {
            const allSongsInStore = this.musicStore.currentSongs();

            const enrichedSongs: SongInterface[] = albumData.songs.map(
              (albumSong: any) => {
                const songId = albumSong.id || albumSong;
                const fullSong = allSongsInStore.find(
                  (s) => String(s.id) === String(songId),
                );

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

            // Фильтруем пустые
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

    // 2. Синхронизация статуса
    this.subs.add(
      this.playerService.isPlaying$.subscribe((isPlaying) => {
        this.isPlayerPlaying = isPlaying;
        this.cdr.detectChanges();
      }),
    );

    // 3. Синхронизация трека
    this.subs.add(
      this.playerService.currentTrack$.subscribe((track) => {
        this.currentTrack = track;
        this.cdr.detectChanges();
      }),
    );
  }

  /**
   * Логика "Большой Кнопки" Play/Pause для альбома.
   * Учитывает валидацию URL.
   */
  togglePlayAlbum() {
    if (!this.album || !this.album.songs || this.album.songs.length === 0)
      return;

    // Если альбом уже играет — просто ставим паузу
    if (this.isAlbumPlaying) {
      this.playerService.togglePlay();
      return;
    }

    // Иначе запускаем воспроизведение с первого ДОСТУПНОГО трека
    const songsList = this.album.songs as SongInterface[];
    const started = this.playerService.playWithValidation(songsList, 0);

    if (!started) {
      alert('No playable tracks found in this album.');
    }
  }

  /**
   * Клик по конкретной строке песни.
   * Делегирует проверку и запуск Сервису.
   */
  onTrackPlayRequest(allTracks: SongInterface[], index: number) {
    const started = this.playerService.playWithValidation(allTracks, index);

    if (!started) {
      alert(
        "That Song doesn't have a URL, choose another one. Hint: with active duration",
      );
    }
  }

  /**
   * Проверка, играет ли сейчас этот альбом
   */
  get isAlbumPlaying(): boolean {
    if (!this.album || !this.currentTrack || !this.album.songs) return false;

    const songsList = this.album.songs as SongInterface[];

    // Проверяем, находится ли текущий трек в списке этого альбома
    const isTrackInAlbum = songsList.some(
      (s) => String(s.id) === String(this.currentTrack?.id),
    );

    // Возвращаем true только если трек из альбома И плеер активен
    return isTrackInAlbum && this.isPlayerPlaying;
  }

  onArtistClick(event: Event): void {
    const idToNavigate = this.album?.artistId;
    if (idToNavigate) {
      event.stopPropagation();
      this.nav.goToArtist(idToNavigate);
    }
  }

  // ... (Остальные методы: setDominantColor, initObserver, ngOnDestroy без изменений)

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
