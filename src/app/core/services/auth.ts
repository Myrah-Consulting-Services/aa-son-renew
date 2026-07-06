import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, timer } from 'rxjs';
import { Api } from './api';
import { ToastService } from './toast.service';
import { CompanyService } from './company.service';
import { HttpClient } from '@angular/common/http';


interface LoginResponse {
  token: string;
  user: any; // Replace with proper user interface if available
}

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  private tokenRefreshInterval: any;

  constructor(
    private api: Api,
    private router: Router,
    private http:HttpClient,
    private toast: ToastService,
    private companyService: CompanyService
  ) {
    // Start token refresh timer if user is authenticated
    if (this.hasValidToken()) {
      this.startTokenRefresh();
      if (!this.companyService.hasActiveCompany()) {
        this.companyService.handlePostLoginNavigation();
      }
    }
  }

  login(credentials: { email: string; password: string }): Observable<LoginResponse> {
    return this.api.post<LoginResponse>('/auth/login/', credentials).pipe(
      tap((response:any) => {
        if(response.status==200){
        if (response && response.token) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          this.isAuthenticatedSubject.next(true);
          this.startTokenRefresh();
          this.companyService.handlePostLoginNavigation();
        }else{
          this.toast.show('Error', response.data, 'danger');
          this.clearAuthData();
        }
      }
    })
    );
  }

  logout(): Observable<any> {
    return this.api.post('/auth/logout/', {}).pipe(
      tap(() => {
        this.clearAuthData();
      })
    );
  }

  refreshToken(): Observable<LoginResponse> {
    return this.api.post<LoginResponse>('/auth/refresh_token/', {}).pipe(
      tap((response) => {
        if (response && response.token) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          this.isAuthenticatedSubject.next(true);
        } else {
          this.clearAuthData();
        }
      })
    );
  }

  private startTokenRefresh(): void {
    // Clear any existing interval
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
    }

    // Refresh token every 14 minutes (assuming token expires in 15 minutes)
    this.tokenRefreshInterval = setInterval(() => {
      this.refreshToken().subscribe({
        error: () => {
          this.clearAuthData();
        }
      });
      // increase the time by 12 hours
    }, 12 * 60 * 60 * 1000);
  }

  private clearAuthData(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.companyService.clearCompanyData();
    this.isAuthenticatedSubject.next(false);
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
    }
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUser(): any {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  private hasValidToken(): boolean {
    const token = this.getToken();
    // Add token validation logic if needed (e.g., JWT expiration check)
    return !!token;
  }

  getUserIp():any{
    //fetch from this url https://api.ipify.org?format=json
    return this.http.get('https://api.ipify.org?format=json').pipe(
      tap((response:any) => {
        if(response && response.ip){
          console.log('IP Address:', response.ip);
          return response.ip;
          
          
        }else{
          this.toast.show('Error', 'Unable to fetch IP address', 'danger');
          return null;
        }
      }
    ));

  }
  getUserLocation():any{
    //fetch from this url https://ipinfo.io/json
    return this.http.get('https://ipinfo.io/json').pipe(
      tap((response:any) => {
        if(response && response.loc){
          return response.loc;
        }else{
          this.toast.show('Error', 'Unable to fetch location', 'danger');
          return null;
        }
      }
    ));
    
  }
}
