import {
    Component,
    EventEmitter,
    input,
    Input,
    Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AlbumInterface, CategoryInterface } from '../../interface/models';

@Component({
    selector: 'app-albumCard',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './albumCard.html',
    styleUrls: ['./albumCard.scss'],
})
export class albumCard {
    constructor(private router: Router) {}

    @Input() title!: string;
    @Input() description!: string;
    @Input() playlistThumbnail: string | null = null;
    @Input() backgroundColor?: string;
    @Input() isTopResult: boolean = false;
    // НОВЫЙ ИНПУТ: Если true, ширина будет 210px. Если false — 100%.
    @Input() fixedSize: boolean = false;

    @Output() select = new EventEmitter<void>();
    @Input() items: AlbumInterface[] = [];
    @Input() itemCtgr: CategoryInterface[]=[];
    @Input() link!: string | any[];

    onClick() {
        this.select.emit();
    }

    isError = false;

    onImageError(event: Event) {
        const img = event.target as HTMLImageElement;
        img.src = 'https://placehold.co/600x400/png';
    }

    ngOnChanges() {
        if (!this.playlistThumbnail) {
            this.isError = true;
        }
    }
    ngOnInit() {}
}
