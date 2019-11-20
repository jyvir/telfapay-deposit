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
            if (channels.length > 0) {
              this.vipAmountList.push(element);
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
      payment_reference: ref
    };
    const req = Utility.generateSign(payload);
    this.commonService.sendVipPayment('', req).pipe(
      catchError((res: HttpErrorResponse) => {
        const errorMsg = res.error && res.error.messages[0] ? res.error.messages[0] : 'Something went wrong';
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
    const modalRef = this.modalService.open(ResponseModalComponent, { size: 'sm' });
    modalRef.componentInstance.data = response;
  }


}