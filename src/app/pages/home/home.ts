import { Component, OnInit, AfterViewInit, OnDestroy, NgZone, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription, filter, take } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { TopNav } from '../../components/top-nav/top-nav';
import { Slider } from '../../components/slider/slider';
import { ApiService } from '../../services/api';
import { AlbumInterface } from '../../interface/models'; // Импорт интерфейса

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, TopNav, Slider],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class Home implements OnInit, AfterViewInit, OnDestroy {

  albums: AlbumInterface[] = [];
  hasError = false;
  errorMessage = '';
  private routerSubscription?: Subscription;

  constructor(
    private api: ApiService,
    private ngZone: NgZone,
    private router: Router,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    this.fetchAlbums();

    this.routerSubscription = this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      filter((event: NavigationEnd) => event.urlAfterRedirects.includes('/home'))
    ).subscribe(() => {
      this.fetchAlbums();
    });
  }

  ngAfterViewInit(): void {
    this.ensureSliderInit();
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  private fetchAlbums(): void {
    this.albums = [];
    this.cdr.detectChanges();

    this.api.getAlbums().pipe(take(1)).subscribe({
      next: (res) => {
        this.albums = res;

        console.log("HOME albums:", this.albums);

        this.cdr.detectChanges();
        setTimeout(() => this.initSlider(), 50);
      },
      error: (err: any) => {
        this.hasError = true;
        this.errorMessage = err.message || 'Ошибка загрузки данных';
        this.cdr.detectChanges();
        console.error('API Error:', err);
      }
    });
  }

  private ensureSliderInit(): void {
    setTimeout(() => {
      if (this.albums.length > 0) {
        this.initSlider();
      }
    }, 0);
  }

  private initSlider(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.albums.length) return;

    this.ngZone.runOutsideAngular(() => {
      const sliderElement = document.querySelector('.swiper-container');
      if (sliderElement) {
        console.log("Slider initialized");
      }
    });
  }

}
