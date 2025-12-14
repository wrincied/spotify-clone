import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Для AsyncPipe, NgIf
import { MusicStoreService } from '../../services/music-store/music-store';
import { Observable } from 'rxjs';
import { SongInterface } from '../../interface/models';

@Component({
    selector: 'app-player',
    imports: [CommonModule],
    templateUrl: './player.html',
    styleUrl: './player.scss',
})
export class PlayerComponent implements OnInit {
    currentTrack$: Observable<SongInterface | null>;
    isPlaying$: Observable<boolean>;
    currentTime$: Observable<number>;
    duration$: Observable<number>;
    isBuffering$: Observable<boolean>;
    constructor(private musicStore: MusicStoreService) {
        this.currentTrack$ = this.musicStore.currentTrack$;
        this.isPlaying$ = this.musicStore.isPlaying$;
        this.currentTime$ = this.musicStore.currentTime$;
        this.duration$ = this.musicStore.duration$;
        this.isBuffering$ = this.musicStore.isBuffering$;
    }
    ngOnInit(): void {}
    togglePlay() {
        this.musicStore.togglePlay();
    }

    onSeek(event: Event) {
        const input = event.target as HTMLInputElement;
        const time = Number(input.value);
        this.musicStore.seekTo(time);
    }
    onVolumeChange(event: Event) {
        const input = event.target as HTMLInputElement;
        const volume = Number(input.value) / 100; // range 0-100 -> 0.0-1.0
        this.musicStore.setVolume(volume);
    }
    nextTrack() {
        this.musicStore.nextTrack();
    }

    prevTrack() {
        this.musicStore.prevTrack();
    }
    formatTime(time: number | null): string {
    if (!time) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }
}
