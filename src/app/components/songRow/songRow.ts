import {
    Component,
    Input,
    Output,
    EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
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
    // === INPUTS ===
    @Input({ required: true }) song!: SongInterface;
    @Input() index: number = 0;
    
    // ВЕРНУЛ ЭТО ПОЛЕ, чтобы не падал SearchComponent
    @Input() thumbnailUrl?: string | null; 
    
    @Input() isSearchMode: boolean = false;
    @Input() currentTrack: SongInterface | null = null;
    @Input() isPlaying: boolean = false;

    // === OUTPUTS ===
    // ТЕПЕРЬ ТИП ПРАВИЛЬНЫЙ: передаем песню, а не void
    @Output() playRequest = new EventEmitter<SongInterface>();

    // === LOGIC ===
    get isCurrent(): boolean {
        return this.currentTrack !== null && String(this.currentTrack.id) === String(this.song.id);
    }
    handlePlay(event: Event) {
        event.stopPropagation(); // Предотвращаем всплытие (если кликнули кнопку внутри строки)
        this.playRequest.emit(this.song);
    }
}