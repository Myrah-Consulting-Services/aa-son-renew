import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Header } from './layout/header/header';
import { NgIf } from '@angular/common';
// import { ToastrModule } from 'ngx-toastr';
import { ToastComponent } from './core/components/toast/toast.component';
import { TitleService } from './core/services/title.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Header, NgIf, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  constructor(
    public router: Router,
    private titleService: TitleService
  ) {}

  ngOnInit() {
    // Set company name as title when app initializes
    this.titleService.setCompanyTitle();
  }

  get showNavbar() {
    return this.router.url !== '/login';
  }
}
