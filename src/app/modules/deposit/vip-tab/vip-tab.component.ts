import { Component, OnInit } from '@angular/core';
import {CommonService} from '../../../core/common/common.service';
import {catchError, flatMap, map, mergeMap} from 'rxjs/operators';
import {Utility} from '../../../shared/helpers/utility';
import {HttpErrorResponse} from '@angular/common/http';
import Swal from "sweetalert2";
import {forkJoin, throwError} from 'rxjs';
import * as moment from 'moment';
import {ResponseModalComponent} from '../../modals/response-modal/response-modal.component';
import {CookieService} from 'ngx-cookie-service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import * as $ from 'jquery';

@Component({
  selector: 'app-vip-tab',
  templateUrl: './vip-tab.component.html',
  styleUrls: ['./vip-tab.component.css']
})
export class VipTabComponent implements OnInit {
  vipAmountList = [];

  constructor(
    private commonService: CommonService,
    private cookie: CookieService,
    private modalService: NgbModal
  ) { }

  ngOnInit() {
    $('.next-icon').hide();
    this.vipAmountList = [];
    this.commonService.retrieveConfigList().pipe(
      mergeMap(
        (resp: any) => {
          const calls = [];
          Object.keys(resp).forEach((element, index) => {
            calls.push(this.commonService.retrieveVipConfig(element));
          });
          return forkJoin(calls);
        }
      )
    ).subscribe(
      dataList => {
        for (const data of dataList) {
          Object.keys(data).forEach((element, index) => {
            const channels = Object.getOwnPropertyDescriptor(data, element).value;
            if (channels.length > 0 && element === 'VipChannel') {
              channels.forEach(val => {
                if (!this.vipAmountList.includes(parseFloat(val.amount))) {
                  this.vipAmountList.push(parseFloat(val.amount));
                };
              });
            }
          });
        };
      }
    );
  }


  send(item, type) {
    const ref = moment().format('YYYYMMDDHHmmss');
    const payload = {
      username: this.cookie.get('username'),
      product_id: this.cookie.get('product_id'),
      amount: item,
      channel: type,
      sign: '',
      payment_reference: ref,
      ip: this.cookie.get('ip'),
      product_ip: this.cookie.get('productIp'),
      prepayment_url: this.cookie.get('prepayment_url'),
      device_id: this.cookie.get('device_id')
    };
    const req = Utility.generateSign(payload);
    this.commonService.sendVipPayment('', req).pipe(
      catchError((res: HttpErrorResponse) => {
        let errorMsg = res.error && res.error.messages[0] ? res.error.messages[0] : 'Something went wrong';
        errorMsg = Utility.manualTranslateErrorMsg(errorMsg);
        Swal.fire({
          html: errorMsg,
          icon: 'error'
        });
        return throwError(JSON.stringify(res));
      })
    ).subscribe(resp => {
      this.openModal(resp, type);
    });
  }

  openModal(response, type) {
    response.type = type;
    const modalRef = this.modalService.open(ResponseModalComponent);
    modalRef.componentInstance.data = response;
  }


}
