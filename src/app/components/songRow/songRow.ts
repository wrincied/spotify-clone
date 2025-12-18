import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SongInterface } from '../../interface/models';
import { FormatTimePipe } from '../../pipes/format-time-pipe';

@Component({
  selector: 'app-songRow',
  standalone: true,
  imports: [CommonModule, FormatTimePipe],
  templateUrl: './songRow.html',
  styleUrl: './songRow.scss',
})
export class SongRow {
  private router = inject(Router);

  @Input({ required: true }) song!: SongInterface;
  @Input() index: number = 0;
  @Input() thumbnailUrl?: string | null;
  @Input() isSearchMode: boolean = false;
  @Input() currentTrack: SongInterface | null = null;
  @Input() isPlaying: boolean = false;

  @Output() playRequest = new EventEmitter<SongInterface>();

  get isCurrent(): boolean {
    return (
      this.currentTrack !== null &&
      String(this.currentTrack.id) === String(this.song.id)
    );
  }

  // Обработчик для РОДИТЕЛЯ (строка целиком)
  handlePlay(event: MouseEvent) {
    console.log('🟦 [SongRow] handlePlay сработал (Клик по строке)');
    
    // Останавливаем, чтобы не ушло выше (если есть что-то выше)
    event.stopPropagation(); 
    this.playRequest.emit(this.song);
  }

  // Обработчик для АРТИСТА (ссылка)
  goToArtist(event: MouseEvent, artistId: string | undefined) {
    console.log('🟧 [SongRow] goToArtist сработал (Клик по имени)');
    console.log('   -> Пришедший ID:', artistId);
    console.log('   -> Объект песни:', this.song);

    // 1. ЖЕСТКАЯ ОСТАНОВКА
    event.stopImmediatePropagation();
    event.stopPropagation();
    event.preventDefault();

    if (!artistId) {
      console.error('❌ [SongRow] Ошибка: artistId отсутствует (undefined/null)!');
      return;
    }

    console.log('✅ [SongRow] Пытаемся перейти по роуту:', ['/artist', artistId]);

    this.router.navigate(['/artist', artistId])
      .then(success => {
        if (success) console.log('🚀 [Router] Переход успешен!');
        else console.warn('⚠️ [Router] Переход отменен или не удался (проверь app.routes.ts)');
      })
      .catch(err => console.error('🔥 [Router] Критическая ошибка навигации:', err));
  }
}