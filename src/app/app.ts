import { Component, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { TopNav } from "./components/top-nav/top-nav";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ReactiveFormsModule, TopNav],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('spotify-clone');
}
