import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-top-nav',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './top-nav.html',
  styleUrls: ['./top-nav.scss']
})
export class TopNav implements OnInit {
  constructor(private router: Router,) { }

  onNagivateToLogin() {
    this.router.navigate(['/','login'])
  }
  ngOnInit(): void {

  }

}
