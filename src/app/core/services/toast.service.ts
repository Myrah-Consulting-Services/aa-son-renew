import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ToastInfo {
  title: string;
  message: string;
  type: 'success' | 'danger' | 'warning' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastSubject = new Subject<ToastInfo>();
  toast$ = this.toastSubject.asObservable();

  show(title: string, message: string, type: 'success' | 'danger' | 'warning' | 'info' = 'info'): void {
    this.toastSubject.next({ title, message, type });
  }
} 