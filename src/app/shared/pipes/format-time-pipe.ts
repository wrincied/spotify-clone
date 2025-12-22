import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatTime',
})
export class FormatTimePipe implements PipeTransform {

  transform(timeInSeconds: number): string {
    if (!timeInSeconds || isNaN(timeInSeconds)) {
      return '0:00';
    }

    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);

    // Добавляем нолик, если секунд меньше 10 (например 3:05 вместо 3:5)
    const secondsString = seconds < 10 ? `0${seconds}` : `${seconds}`;

    return `${minutes}:${secondsString}`;
  }

}
