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
  isSticky: boolean = false;
  private observer?: IntersectionObserver;
  private sub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    public musicStore: MusicStoreService,
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const id = this.route.snapshot.paramMap.get('id');
      if (!id) return;

      this.gradientColor = 'linear-gradient(to bottom, #333, #121212)';
      this.mainColor = '#1f1f1f';

      this.sub = this.api.getPlaylistById(id).subscribe({
        next: (album) => {
          this.album = album;
          if (album.cover) this.setDominantColor(album.cover);
          this.cdr.detectChanges();
          this.initObserver();
        },
        error: (err) => console.error(err),
      });
    });
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

  ngAfterViewInit() {}

  initObserver() {
    if (this.observer) this.observer.disconnect();
    const scrollContainer = document.querySelector('.spotify-main');
    if (!scrollContainer || !this.albumHeaderRef) return;

    const options = {
      root: scrollContainer,
      threshold: 0,
      rootMargin: '-70px 0px 0px 0px',
    };

    this.observer = new IntersectionObserver(([entry]) => {
      const top = entry.boundingClientRect.top;
      const shouldBeSticky = !entry.isIntersecting && top < 64;
      if (this.isSticky !== shouldBeSticky) {
        this.isSticky = shouldBeSticky;
        this.cdr.detectChanges();
      }
    }, options);

    this.observer.observe(this.albumHeaderRef.nativeElement);
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    this.observer?.disconnect();
  }

  // === ВСЯ ЛОГИКА ТЕПЕРЬ ТУТ: ПРОСТО ЗОВЕМ СЕРВИС ===
  handlePlay(song: SongInterface) {
    if (!this.album) return;

    // Сервис сам решит: пауза или новый трек
    this.musicStore.playOrPause(song, this.album.songs, this.album.cover || '');
  }
}
