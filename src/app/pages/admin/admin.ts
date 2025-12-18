import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AdminService } from '../../services/adminService/admin-service';
import {
  ArtistInterface,
  SongInterface,
  AlbumInterface,
  CategoryInterface,
} from '../../interface/models';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TitleCasePipe],
  templateUrl: './admin.html',
  styleUrls: ['./admin.scss'],
})
export class AdminComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  public admin = inject(AdminService);

  editingItem = signal<{ type: string; data: any } | null>(null);

  artistForm!: FormGroup;
  songForm!: FormGroup;
  albumForm!: FormGroup;
  categoryForm!: FormGroup;
  editForm!: FormGroup;

  ngOnInit() {
    this.initForms();
    this.admin.loadAll();
  }

  private initForms() {
    this.artistForm = this.fb.group({
      name: ['', Validators.required],
      avatar: [''],
      bio: [''],
      followers: [0],
    });

    this.songForm = this.fb.group({
      title: ['', Validators.required],
      url: ['', Validators.required],
      thumbnail: [''],
      artistId: [''],
      categoryId: [''],
      description: [''], // Artist name text
    });

    this.albumForm = this.fb.group({
      title: ['', Validators.required],
      cover: [''],
      artistId: [''],
      description: [''],
      releaseYear: [''], 
    });

    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      color: ['#1db954'],
      description: [''],
    });

    // Универсальная форма редактирования [cite: 2025-12-14]
    this.editForm = this.fb.group({
      name: ['', Validators.required],
      thumbnail: [''],
      description: [''], // Используется для bio, description и artist name
      url: [''],
      color: ['#1db954'],
      followers: [0],
      releaseYear: [''],
    });
  }

  openEditModal(type: string, data: any) {
    this.editingItem.set({ type, data });

    this.editForm.patchValue({
      name: data.name || data.title || '',
      thumbnail: data.avatar || data.thumbnail || data.cover || '',
      description: data.description || data.bio || '', // Маппинг bio -> description
      url: data.url || '',
      color: data.color || '#1db954',
      followers: data.followers || 0,
      releaseYear: data.releaseYear || '',
    });
  }

  handleCreate(type: string, form: FormGroup) {
    if (form.invalid) return;

    const apiUrl = `http://localhost:3000/api/${type}`;
    this.http.post(apiUrl, form.value, { withCredentials: true }).subscribe({
      next: () => {
        this.admin.addLog(`SUCCESS: Created ${type}`);
        form.reset({ color: '#1db954', followers: 0 });
        this.admin.loadAll();
      },
      error: (err) => this.admin.addLog(`ERROR: ${err.message}`),
    });
  }

  handleUpdate(type: string, id: string) {
    if (this.editForm.invalid) return;

    const val = this.editForm.value;
    const payload: any = {};

    // Маппинг полей согласно моделям данных [cite: 2025-12-14]
    if (type === 'artists') {
      payload.name = val.name;
      payload.avatar = val.thumbnail;
      payload.bio = val.description;
      payload.followers = val.followers;
    } else if (type === 'songs') {
      payload.title = val.name;
      payload.url = val.url;
      payload.thumbnail = val.thumbnail;
      payload.artist = val.description; // SongInterface.artist
    } else if (type === 'albums') {
      payload.title = val.name;
      payload.cover = val.thumbnail;
      payload.description = val.description;
      payload.releaseYear = val.releaseYear;
    } else if (type === 'categories') {
      payload.name = val.name;
      payload.color = val.color;
      payload.description = val.description;
    }

    const apiUrl = `http://localhost:3000/api/${type}/${id}`;
    this.http.put(apiUrl, payload, { withCredentials: true }).subscribe({
      next: () => {
        this.admin.addLog(`UPDATED: ${type} ${id}`);
        this.editingItem.set(null);
        this.admin.loadAll();
      },
      error: (err) => this.admin.addLog(`ERROR: Update failed`),
    });
  }

  handleDelete(type: string, id: string) {
    if (!confirm('Are you sure?')) return;
    const apiUrl = `http://localhost:3000/api/${type}/${id}`;
    this.http.delete(apiUrl, { withCredentials: true }).subscribe({
      next: () => {
        this.admin.addLog(`DELETED: ${type} ${id}`);
        this.admin.loadAll();
      },
      error: (err) => this.admin.addLog(`ERROR: Delete failed`),
    });
  }
}
