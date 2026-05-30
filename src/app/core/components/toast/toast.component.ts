import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ToastService, ToastInfo } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container position-fixed top-0 end-0 p-3">
      <div *ngFor="let toast of toasts" 
           class="toast show" 
           role="alert" 
           aria-live="assertive" 
           aria-atomic="true"
           [ngClass]="'bg-' + toast.type">
        <div class="toast-header">
          <strong class="me-auto">{{ toast.title }}</strong>
          <button type="button" 
                  class="btn-close" 
                  aria-label="Close"
                  (click)="removeToast(toast)">
          </button>
        </div>
        <div class="toast-body text-white">
          {{ toast.message }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      // z-index: 1050;
      z-index: 2000 !important;
      position: fixed;
    }
    .toast {
      min-width: 300px;
      margin-bottom: 0.5rem;
    }
    .toast.bg-success {
      background-color: #198754 !important;
    }
    .toast.bg-danger {
      background-color: #dc3545 !important;
    }
    .toast.bg-warning {
      background-color: #ffc107 !important;
    }
    .toast.bg-info {
      background-color: #0dcaf0 !important;
    }
    .toast-header {
      background-color: rgba(255, 255, 255, 0.1);
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    }
    .toast-body {
      background-color: transparent;
    }
  `]
})
export class ToastComponent implements OnInit, OnDestroy {
  toasts: ToastInfo[] = [];
  private subscription: Subscription;

  constructor(private toastService: ToastService) {
    this.subscription = this.toastService.toast$.subscribe(toast => {
      this.toasts.push(toast);
      setTimeout(() => this.removeToast(toast), 5000); // Auto remove after 5 seconds
    });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  removeToast(toast: ToastInfo): void {
    this.toasts = this.toasts.filter(t => t !== toast);
  }
} 