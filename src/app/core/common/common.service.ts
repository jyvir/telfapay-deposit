import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {CookieService} from 'ngx-cookie-service';
import {PageListModel} from '../../shared/models/page-list.model';
import {Utility} from "../../shared/helpers/utility";
import {SearchFieldModel} from "../../shared/models/search-field.model";

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

  public retrieveConfig(id): Observable<any> {
    return this.http.get(`${environment.api}/cashier/config/${id}`, httpOptions);
  }

  public retrievePayment(id): Observable<any> {
    return this.http.get(`${environment.api}/cashier/payment/${id}`, httpOptions);
  }

  public retrievePaymentList(data: any, sort, search): Observable<PageListModel<any>> {
    this.searchData = [];
    if (search) {
      Object.keys(data).forEach((element, index) => {
        if (Object.getOwnPropertyDescriptor(data, element).value) {
          let param: SearchFieldModel;
          const logic = 'EQ';
          let fieldName = element.toString();
          const value = Object.getOwnPropertyDescriptor(data, element).value;
          if (fieldName === 'fromDate') {
            fieldName = 'fromDateUpdate';
          } else if (fieldName === 'toDate') {
            fieldName = 'toDateUpdate';
          }
          param = Utility.searchUtility(fieldName, logic, value);
          this.searchData.push(param);
        }
      });
    }
    return this.http.post<PageListModel<any>>(`${environment.api}/cashier/payment?sort=${sort}`, JSON.stringify(this.searchData), httpOptions);
  }

  public sendPayment(url, data): Observable<any> {
    const token = this.cookie.get('token');
    httpOptionsPay.headers = httpOptionsPay.headers.set('CashierToken', token)
    return this.http.post(`${environment.api}/online-pay/deposit`, data, httpOptionsPay);
  }
}
