import { Component, Inject, NgZone, PLATFORM_ID, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterOutlet, RouterLinkWithHref, RouterLink } from '@angular/router';
import { TopNav } from "./components/top-nav/top-nav";
import { isPlatformBrowser } from '@angular/common';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ReactiveFormsModule, TopNav, RouterLinkWithHref, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('spotify-clone');
  constructor(
    private router: Router,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.runGlobalUiUpdates();
      });
  }

  private runGlobalUiUpdates(): void {
    this.ngZone.runOutsideAngular(() => {

      // Пример: переинициализация slider


      // Пример: скролл вверх при смене страницы
      document.querySelector('.spotify-main')?.scrollTo(0, 0);
    });
  }
  showLayout(): boolean {
    return !this.router.routerState.snapshot.root.firstChild?.data['noLayout'];
  }
}


