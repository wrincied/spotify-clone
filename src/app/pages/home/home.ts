import { Component, OnInit, AfterViewInit, OnDestroy, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription, filter, take } from 'rxjs';

import { TopNav } from '../../components/top-nav/top-nav';
import { Slider } from '../../components/slider/slider';
import { ApiService } from '../../services/api';

interface Album {
  id: number;
  title: string;
  artist: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, TopNav, Slider],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class Home implements OnInit, AfterViewInit, OnDestroy {
  SongCards: Album[] = [];
  hasError = false;
  errorMessage = '';
  private routerSubscription: Subscription | undefined;

  constructor(
    private api: ApiService,
    private ngZone: NgZone,
    private router: Router,
    private cdr: ChangeDetectorRef // Добавлен для принудительного обновления View при получении данных
  ) {}

  ngOnInit(): void {
    // 1. Загружаем данные при инициализации компонента
    this.fetchAlbums();

    // 2. Подписываемся на события навигации.
    // Это критически важно, если компонент не уничтожается при переходе Login -> Home.
    // ActivatedRoute.params может не сработать, если параметры URL не меняются, поэтому используем глобальный Router.
    this.routerSubscription = this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      filter((event: NavigationEnd) => event.urlAfterRedirects.includes('/home'))
    ).subscribe(() => {
      this.fetchAlbums();
    });
  }

  ngAfterViewInit(): void {
    // Первая попытка инициализации слайдера (на случай, если данные кэшированы и пришли мгновенно)
    this.ensureSliderInit();
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  private fetchAlbums(): void {
    // Очищаем массив, чтобы сбросить старое состояние
    this.SongCards = []; 
    // Принудительно запускаем проверку изменений, чтобы UI отреагировал на очистку
    this.cdr.detectChanges(); 

    this.api.getAlbums().pipe(
      take(1) // Гарантируем завершение потока после одного значения
    ).subscribe({
      next: (data) => {
        this.SongCards = data as Album[];
        this.hasError = false;
        
        // Обновляем UI с новыми данными
        this.cdr.detectChanges();

        // Инициализируем слайдер с задержкой, чтобы DOM успел построиться
        setTimeout(() => this.initSlider(), 50);
      },
      error: (err) => {
        this.hasError = true;
        this.errorMessage = err.message || 'Ошибка загрузки данных';
        this.cdr.detectChanges();
        console.error('API Error:', err);
      }
    });
  }

  private ensureSliderInit(): void {
    setTimeout(() => {
      if (this.SongCards && this.SongCards.length > 0) {
        this.initSlider();
      }
    }, 0);
  }

  private initSlider(): void {
    if (!this.SongCards || this.SongCards.length === 0) {
      return;
    }

    // Запускаем инициализацию сторонних библиотек вне зоны Angular,
    // чтобы избежать проблем с Гидрацией и лишних циклов обнаружения изменений.
    this.ngZone.runOutsideAngular(() => {
      // Здесь должен быть код инициализации вашей библиотеки слайдера
      const sliderElement = document.querySelector('.swiper-container');
      if (sliderElement) {
        // new Swiper(...)
        console.log('Slider initialized via NgZone');
      }
    });
  }
}