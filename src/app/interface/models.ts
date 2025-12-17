export interface SongInterface {
  id: string;
  title: string;
  artist: string; // Имя артиста (текст)
  artistId?: string; // ID артиста (для сравнения и ссылок)
  thumbnail: string | null;
  duration: number;
  url: string;
}

export interface PlayerState {
  isPlaying: boolean;
  currentTrack: SongInterface | null;
  volume: number; // 0.0 - 1.0
  currentTime: number;
  duration: number; // Текущая длительность из метаданных аудио
  isBuffering: boolean;
}
export interface AlbumInterface {
  id: string;
  title: string; // Было name, но в интерфейсе title - приводим к стандарту
  description: string;
  cover: string | null; // Ссылка на картинку
  year?: number; // Год выпуска
  type?: 'Album' | 'EP' | 'Single';
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
  title: string; // Сюда попадет Album.title или Category.name
  subtitle?: string; // Сюда Album.description или "Rock Mix"
  image?: string; // Сюда Album.cover или Song.thumbnail
  color?: string; // Сюда Category.color (для полоски снизу)
  type: 'album' | 'playlist' | 'category' | 'focus'; // Чтобы понимать, куда кликать
}

export interface ArtistInterface {
  id: string;
  name: string;
  avatar: string; // Фото артиста
  followers: number; // Число подписчиков
  bio?: string;
  isVerified?: boolean; // Галочка верификации
  topTracks: SongInterface[];
  albums: AlbumInterface[];
}

export interface PlayerTrackInterface extends SongInterface {
  coverUrl: string; // А вот тут она обязательна для UI плеера
}
export type TrackWithContext = SongInterface & {
  albumId: string;
  coverFromAlbum: string | null;
};
