import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  AfterViewInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { FastAverageColor } from 'fast-average-color'; // Импорт

// Твои импорты
import { ApiService } from '../../services/ApiService/api';
import { AlbumInterface } from '../../interface/models';
import { SongRow } from '../../components/songRow/songRow'; // Исправлено имя класса?

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
  mainColor: string = '#333'; // Цвет для sticky-header

  @ViewChild('albumHeaderRef') albumHeaderRef!: ElementRef;

  isSticky: boolean = false;
  private observer?: IntersectionObserver;
  private sub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const id = this.route.snapshot.paramMap.get('id');
      if (!id) return;

      this.gradientColor = 'linear-gradient(to bottom, #333, #121212)';
      this.mainColor = '#1f1f1f'; // Цвет для sticky-header
      this.sub = this.api.getPlaylistById(id).subscribe({
        next: (album) => {
          this.album = album;
          if (album.cover) this.setDominantColor(album.cover);

          // ВАЖНО: Принудительно обновляем HTML, чтобы @if(album) сработал и элементы появились
          this.cdr.detectChanges();

          // ТЕПЕРЬ запускаем Observer, когда элементы точно есть на экране
          this.initObserver();
        },
        error: (err) => console.error(err),
      });
    });
  }
  loadPlaylist(id: string) {
    this.sub = this.api.getPlaylistById(id).subscribe({
      next: (album) => {
        this.album = album;

        // Как только получили альбом — вычисляем цвет обложки
        if (album.cover) {
          this.setDominantColor(album.cover);
        }

        this.cdr.detectChanges();
        // Запускаем Sticky Observer только когда контент готов
        setTimeout(() => this.initObserver(), 0);
      },
      error: (err) => console.error(err),
    });
  }
  setDominantColor(imageUrl: string) {
    const fac = new FastAverageColor();
    fac
      .getColorAsync(imageUrl)
      .then((color) => {
        // color.hex — это основной цвет (например, #ff0055)

        // 2. Обновляем переменную для Sticky Header (сплошной цвет)
        this.mainColor = color.hex;

        // 3. Обновляем переменную для Большой Шапки (градиент)
        this.gradientColor = `linear-gradient(to bottom, ${color.hex}, #121212)`;

        this.cdr.detectChanges();
      })
      .catch(() => {
        // Если ошибка или картинка белая — ставим дефолт
        this.mainColor = '#333';
        this.gradientColor = 'linear-gradient(to bottom, #333, #121212)';
        this.cdr.detectChanges();
      });
  }

  // ngAfterViewInit оставляем пустым или удаляем, логику перенесли в initObserver
  ngAfterViewInit() {}

  initObserver() {
    // Если observer уже был создан - отключаем старый
    if (this.observer) this.observer.disconnect();

    const scrollContainer = document.querySelector('.spotify-main');
    if (!scrollContainer || !this.albumHeaderRef) return;

    const options = {
      root: scrollContainer,
      threshold: 0,
      // -64px (TopNav) - 100px (чуть пораньше начинаем показывать)
      rootMargin: '-70px 0px 0px 0px',
    };

    this.observer = new IntersectionObserver(([entry]) => {
      const top = entry.boundingClientRect.top;

      // Логика: если элемент ушел вверх (top < 64) И перестал быть полностью видимым
      const shouldBeSticky = !entry.isIntersecting && top < 64;

      if (this.isSticky !== shouldBeSticky) {
        this.isSticky = shouldBeSticky;
        this.cdr.detectChanges(); // Обновляем класс visible
      }
    }, options);

    this.observer.observe(this.albumHeaderRef.nativeElement);
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    this.observer?.disconnect();
  }
}
