import { Component, Input } from '@angular/core';
import { SongInterface } from '../../interface/models';
import { FormatTimePipe } from '../../pipes/format-time-pipe';

@Component({
  selector: 'app-songRow',
  imports: [FormatTimePipe],
  templateUrl: './songRow.html',
  styleUrl: './songRow.scss',
})
export class SongRow {
  @Input({ required: true }) song!: SongInterface;
  @Input() index: number = 0;
}
