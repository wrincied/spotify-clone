import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  Observable,
  combineLatest,
  map,
  switchMap,
  shareReplay,
  take,
} from 'rxjs';

// ОБЯЗАТЕЛЬНО ИМПОРТИРУЕМ SongRow
import { SongRow } from '../../components/songRow/songRow';
import { ArtistService } from '../../services/artistService/artist-service';
import { PlayerService } from '../../services/playerService/player-service';
import { ArtistInterface, SongInterface } from '../../interface/models';

@Component({
  selector: 'app-page-artist',
  standalone: true,
  imports: [CommonModule, SongRow], // <-- ПРОВЕРЬ ЭТО
  templateUrl: './artist-page.html',
  styleUrls: ['./artist-page.scss'],
})
export class PageArtistComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private artistService = inject(ArtistService);
  public playerService = inject(PlayerService);

  artist$!: Observable<ArtistInterface>;

  // Поток: true, если сейчас играет трек ИМЕННО ЭТОГО артиста
  isArtistPlaying$!: Observable<boolean>;

  ngOnInit() {
    const artistId$ = this.route.paramMap.pipe(
      map((params) => params.get('id') as string),
      shareReplay(1),
    );

    this.artist$ = artistId$.pipe(
      switchMap((id) => this.artistService.getArtist(id)),
    );

    // Вычисляем, играет ли сейчас этот артист
    this.isArtistPlaying$ = combineLatest([
      this.playerService.isPlaying$,
      this.playerService.currentTrack$,
      this.artist$,
    ]).pipe(
      map(([isPlaying, currentTrack, artist]) => {
        if (!currentTrack || !artist) return false;
        return isPlaying && currentTrack.artistId === artist.id;
      }),
    );
  }

  // Главная кнопка Play (зеленая)
  togglePlayArtist(event: MouseEvent, artist: ArtistInterface) {
    event.stopPropagation(); // <--- ЭТО ОСТАНОВИТ ЛИШНИЕ ВЫЗОВЫ

    if (!artist.topTracks || artist.topTracks.length === 0) return;

    // 1. Читаем текущее состояние МГНОВЕННО (это правильно!)
    const currentTrack = this.playerService.currentTrack();
    // const isPlaying = this.playerService.isPlaying(); // Можно прочитать, если нужно для логики

    // 2. Логика:
    // Если сейчас УЖЕ играет (или стоит на паузе) трек этого артиста...
    if (currentTrack && currentTrack.artistId === artist.id) {
      // ...то мы просто переключаем паузу (сервис сам разберется)
      this.playerService.togglePlay();
    } else {
      // Иначе — это новый артист, загружаем его плейлист с 0-го трека
      this.playerService.playTrackList(artist.topTracks, 0);
    }
    return this.playerService.isPlaying();
  }

  getYear(album: any): string {
    return '2024';
  }
}
