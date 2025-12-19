import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  OnChanges,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FitText } from '../../directives/fit-text';
import { NavigationService } from '../../services/navigationService/navigation-service';

@Component({
  selector: 'app-albumCard',
  standalone: true,
  imports: [CommonModule, FitText],
  templateUrl: './albumCard.html',
  styleUrls: ['./albumCard.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class albumCard {
  private nav = inject(NavigationService);
  // === INPUTS ===
  @Input({ required: true }) id!: string;
  @Input({ required: true }) title!: string;
  @Input() description?: string;
  @Input() artistId?: string; // Для перехода на артиста из заголовка
  @Input() playlistThumbnail: string | null = null;
  @Input() backgroundColor?: string;
  @Input() isTopResult = false;
  @Input() fixedSize = false;
  @Input() isPlaying = false;
  @Input() releaseYear?: string;
  @Input() type: 'album' | 'category' | 'artist' = 'album';

  // === OUTPUTS ===
  @Output() playRequest = new EventEmitter<void>();
  // === STATE ===

  ngOnInit() {}

  onCardClick(): void {
    switch (this.type) {
      case 'album':
        this.nav.goToAlbum(this.id);
        break;
      case 'category':
        this.nav.goToCategory(this.id);
        break;
      case 'artist':
        this.nav.goToArtist(this.id);
        break;
    }
  }
  onArtistClick(event: Event): void {
    if (this.artistId) {
      event.stopPropagation(); // Предотвращаем срабатывание onCardClick
      this.nav.goToArtist(this.artistId);
    }
  }
  handlePlay(event: Event): void {
    event.stopPropagation();
    this.playRequest.emit();
  }
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'https://placehold.co/56'; // Используем локальную заглушку проекта
  }
  getYear(): string | null {
    if (this.releaseYear) return this.releaseYear;
    
    if (this.description) {
      const yearMatch = this.description.match(/\d{4}/);
      if (yearMatch) return yearMatch[0];
    }
    return null;
  }
}
