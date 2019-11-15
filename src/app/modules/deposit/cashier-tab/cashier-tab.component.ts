import {AfterViewInit, Component, OnInit} from '@angular/core';
import {CommonService} from '../../../core/common/common.service';
import {catchError, map} from 'rxjs/operators';
import {CookieService} from 'ngx-cookie-service';
import {Utility} from '../../../shared/helpers/utility';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import * as moment from 'moment';
import {EMPTY, throwError} from 'rxjs';
import {HttpErrorResponse} from '@angular/common/http';

@Component({
  selector: 'app-cashier-tab',
  templateUrl: './cashier-tab.component.html',
  styleUrls: ['./cashier-tab.component.css']
})
export class CashierTabComponent implements OnInit, AfterViewInit {
  channelList = [];
  constructor(
    private commonService: CommonService,
    private cookie: CookieService,
    private modalService: NgbModal
  ) { }

  ngOnInit() {
    console.log('cash')
  }

  fetchConfig(id) {
    this.channelList = [];
    this.commonService.retrieveConfig(id).pipe(
      map(data => {
        Object.keys(data).forEach((element, index) => {
          const channels = Object.getOwnPropertyDescriptor(data, element).value;
          if (channels.length > 0) {
            channels.forEach(val => {
              const formattedData = {
                amount: element,
                channel: val
              };
              this.channelList.push(formattedData);
            });
          }
        });
      })
    ).subscribe(
      error => {
        console.log(error);
      }
    );
  }

  ngAfterViewInit(): void {

  }

  send(item) {
    const ref = moment().format('YYYYMMDDHHmmss');
    const payload = {
      login_name: this.cookie.get('username'),
      product_id: this.cookie.get('product_id'),
      amount: item.amount,
      channel: item.channel,
      sign: '',
      payment_reference: ref
    };
    const req = Utility.generateSign(payload);
    this.commonService.sendPayment('', req).pipe(
      catchError((res: HttpErrorResponse) => {
        console.log(JSON.stringify(res));
        Swal.fire({
          html: res.error.messages[0],
          icon: 'error'
        });
        return throwError(JSON.stringify(res));
      })
    ).subscribe(resp => {
      Swal.fire({
        html: `Reference: ${resp.systemReference}`,
        icon: 'success'
      });
    },
    error => {
      const errorMsg = error.error && error.error.messages[0] ? error.error.messages[0] : 'Something went wrong';
      Swal.fire({
        html: errorMsg,
        icon: 'error'
      });
    });
  }
}
