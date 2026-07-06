import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
import { Auth } from './auth';

@Injectable({
  providedIn: 'root'
})
export class Api {
  private baseUrl = 'https://aasonsapi.esarwa.com';

  constructor(
    private http: HttpClient
  ) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }
  getUserCompany(){
    const activeCompanyId = localStorage.getItem('active_company_id');
    if (activeCompanyId) {
      return Number(activeCompanyId);
    }

    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      return user[0]?.company[0]?.company;
    }
    return null;
  }

  get<T>(path: string, params: any = {}): Observable<T> {
    const headers = this.getHeaders();
    const httpParams = new HttpParams({ fromObject: params });
    return this.http.get<T>(`${this.baseUrl}${path}`, { headers, params: httpParams });
  }
  getcurrencies(){
    const currencies = localStorage.getItem('inv_code');
    if(currencies){
      return JSON.parse(currencies);
    }
    return null;
  }
  getcurrenciesecond(){
    const currencies = localStorage.getItem('selected_currency');
    if(currencies){
      return JSON.parse(currencies);
    }
    return null;
  }

  post<T>(path: string, body: any = {}): Observable<T> {
    const headers = this.getHeaders();
    return this.http.post<T>(`${this.baseUrl}${path}`, body, { headers });
  }
  post2<T>(path: string, body: any = {}): Observable<T> {
    const headers = this.fileHeader2();
    return this.http.post<T>(`${this.baseUrl}${path}`, body );
  }
  put<T>(path: string, body: any = {}): Observable<T> {
    const headers = this.getHeaders();
    return this.http.put<T>(`${this.baseUrl}${path}`, body, { headers });
  }
  put2<T>(path: string, body: any = {}): Observable<T> {
    const headers = this.getHeaders();
    return this.http.put<T>(`${this.baseUrl}${path}`, body);
  }
  delete<T>(path: string): Observable<T> {
    const headers = this.getHeaders();
    return this.http.delete<T>(`${this.baseUrl}${path}`, { headers });
  }
  getCompanyId(){
    return this.getUserCompany();
  }
  uplaoadImg(url: string,data: any){
    return this.http.post(this.baseUrl + url, data,this.fileHeader2())
  }
  uploadPut(url: string,data: any){
    return this.http.put(this.baseUrl + url, data,this.fileHeader2())

  }
  public fileHeader2() {
    const session = sessionStorage.getItem("token");
    if (session != null && session!='undefined') {
   
      const rawSession = JSON.parse(session);
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${rawSession}`
      });
      let options = { headers: headers };
      console.log("bearer ", options);
      return options ;
    }
    return  { headers: new HttpHeaders() }
  }
  // make afunction that give end_date as todays date and start date as one month ago from todays date
  getDateRange(){
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);
    return {
      end_date: today.toISOString().split('T')[0],
      start_date: oneMonthAgo.toISOString().split('T')[0]
    }
  }
}
