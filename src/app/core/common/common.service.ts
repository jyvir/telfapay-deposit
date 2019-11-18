import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {CookieService} from 'ngx-cookie-service';
import {PageListModel} from '../../shared/models/page-list.model';

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json'
  })
};

const httpOptionsPay = {
  headers: new HttpHeaders({
    'Content-Type': 'application/x-www-form-urlencoded',
  })
};

@Injectable({
  providedIn: 'root'
})
export class CommonService {
  searchData = [];
  constructor(
    private http: HttpClient,
    private cookie: CookieService
  ) {
  }

  public retrieveToken(): Observable<any> {
    const token = this.cookie.get('token');
    httpOptions.headers = httpOptions.headers.set('CashierToken', `Cashier:${token}`)
    return this.http.get(`${environment.api}/cashier/token`, httpOptions);
  }

  public retrieveConfigList(): Observable<any> {
    return this.http.get(`${environment.api}/cashier/config/list`, httpOptions);
  }

  public retrieveVIPAmounts(): Observable<any> {
    return this.http.get(`${environment.api}/cashier/config/vip`, httpOptions);
  }

  public retrieveConfig(id): Observable<any> {
    return this.http.get(`${environment.api}/cashier/config/${id}`, httpOptions);
  }

  public retrievePayment(id): Observable<any> {
    return this.http.get(`${environment.api}/cashier/payment/${id}`, httpOptions);
  }

  public retrievePaymentList(data: any, sort, search): Observable<PageListModel<any>> {
    this.searchData = [];
    return this.http.post<PageListModel<any>>(`${environment.api}/cashier/payment?sort=${sort}`, JSON.stringify(this.searchData), httpOptions);
  }

  public sendPayment(url, data): Observable<any> {
    const token = this.cookie.get('token');
    httpOptionsPay.headers = httpOptionsPay.headers.set('CashierToken', token)
    return this.http.post(`${environment.api}/online-pay/deposit`, data, httpOptionsPay);
  }

  public sendVipPayment(url, data): Observable<any> {
    const token = this.cookie.get('token');
    httpOptionsPay.headers = httpOptionsPay.headers.set('CashierToken', token)
    return this.http.post(`${environment.api}/online-pay/payment-deposit`, data, httpOptionsPay);
  }
}
