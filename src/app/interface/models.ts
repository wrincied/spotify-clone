export interface SongInterface {
  thumbnail: string | null;
  id: string;
  title: string;
  duration: number;
  artist: string;
  url: string;
}
export interface PlayerState{
  isPlaying: boolean;
  currentTrack: SongInterface | null;
  volume: number;     // 0.0 - 1.0
  currentTime: number;
  duration: number;   // Текущая длительность из метаданных аудио
  isBuffering: boolean;
}
export interface AlbumInterface {
  thumbnail: any;
  id: string;
  title: string;
  description: string;
  cover: string | null;
  songs: SongInterface[]; // Строгая типизация вместо any[]
}
export interface CategoryInterface {
  name: string;
  description: string;
  id: string;
  color: string;
  albums?: string[]; // ids of albums
  songs?: string[]; // ids of songs
  playlists?: string[]; // future
}
export interface CardItemInterface {
  id: string;
  title: string;        // Сюда попадет Album.title или Category.name
  subtitle?: string;    // Сюда Album.description или "Rock Mix"
  image?: string;       // Сюда Album.cover или Song.thumbnail
  color?: string;       // Сюда Category.color (для полоски снизу)
  type: 'album' | 'playlist' | 'category' | 'focus'; // Чтобы понимать, куда кликать
}

