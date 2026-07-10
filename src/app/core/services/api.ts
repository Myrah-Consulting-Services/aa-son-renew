import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
import { Auth } from './auth';

@Injectable({
  providedIn: 'root'
})
export class Api {
  private baseUrl = 'https://aasonsapi.esarwa.com';
  // private baseUrl = 'http://192.168.1.8:8000';

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
    return this.getCompanyId();
  }

  getCompanyId(){
    const activeCompanyId = localStorage.getItem('active_company_id');
    if (activeCompanyId) {
      return Number(activeCompanyId);
    }

    const userData = localStorage.getItem('user');
    if (!userData) {
      return null;
    }
    const user = JSON.parse(userData);
    const row = Array.isArray(user) ? user[0] : user;
    if (!row) {
      return null;
    }
    if (row.active_company_id != null && row.active_company_id !== '') {
      return row.active_company_id;
    }
    if (row.company?.[0]?.company != null && row.company[0].company !== '') {
      return row.company[0].company;
    }
    if (row.companies?.[0]?.id != null && row.companies[0].id !== '') {
      return row.companies[0].id;
    }
    return null;
  }

  /** Merge tenant company into query/body params for multi-company APIs. */
  withCompanyParams(params: Record<string, any> = {}): Record<string, any> {
    const companyId = this.getUserCompany();
    if (companyId != null && companyId !== '') {
      return { ...params, company: companyId };
    }
    return params;
  }

  listItems(search: string = '', params: Record<string, any> = {}): Observable<any> {
    const term = (search || '').trim();
    const path = `/items/list-item/s=${term ? encodeURIComponent(term) : ''}/`;
    return this.post(path, this.withCompanyParams(params));
  }

  listWarehouses(params: Record<string, any> = {}): Observable<any> {
    return this.get('/warehouses/list-warehouse/', this.withCompanyParams(params));
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
  postBlob(path: string, body: any = {}): Observable<Blob> {
    const headers = this.getHeaders();
    return this.http.post(`${this.baseUrl}${path}`, body, {
      headers,
      responseType: 'blob',
    });
  }
  downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
  handleBlobExport(blob: Blob, filename: string, onError: (message: string) => void): void {
    if (blob.type.includes('json') || blob.type.includes('text')) {
      blob.text().then((text) => {
        try {
          const err = JSON.parse(text);
          onError(err.error || 'Export failed');
        } catch {
          onError('Export failed');
        }
      });
      return;
    }
    this.downloadFile(blob, filename);
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
  getCompanyId2(){
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
