import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Auth } from '../../core/services/auth';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {
  isLoggingOut = false;

  constructor(private auth: Auth) {}

  get isAuthenticated$() {
    return this.auth.isAuthenticated$;
  }

  onLogout(): void {
    this.isLoggingOut = true;
    this.auth.logout().subscribe({
      next: () => {
        this.isLoggingOut = false;
      },
      error: () => {
        this.isLoggingOut = false;
      }
    });
  }
}
