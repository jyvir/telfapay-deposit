import { Component, OnInit } from '@angular/core';
import {CommonService} from '../../../core/common/common.service';
import {catchError, map, mergeMap} from 'rxjs/operators';
import {forkJoin, throwError} from 'rxjs';
import {Utility} from '../../../shared/helpers/utility';
import * as moment from 'moment';
import {HttpErrorResponse} from '@angular/common/http';
import Swal from "sweetalert2";
import {ResponseModalComponent} from '../../modals/response-modal/response-modal.component';
import {CookieService} from 'ngx-cookie-service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-search-tab',
  templateUrl: './search-tab.component.html',
  styleUrls: ['./search-tab.component.css']
})
export class SearchTabComponent implements OnInit {
  amountSearch = '';

  channelList = [];
  columns: number;
  constructor(
    private commonService: CommonService,
    private cookie: CookieService,
    private modalService: NgbModal
  ) {
    this.initData();
  }

  ngOnInit() {
    this.columns = Number(this.cookie.get('columns'));
  }

  initData() {
    this.channelList = [];
    this.commonService.retrieveConfigList().pipe(
      mergeMap(
        (resp: any) => {
          const calls = [];
          Object.keys(resp).forEach((element, index) => {
            calls.push(this.commonService.retrieveConfig(element));
            calls.push(this.commonService.retrieveVipConfig(element));
          });
          return forkJoin(calls).pipe(
            map(
              dataList => {
                let datas = [];
                for (const data of dataList) {
                  Object.keys(data).forEach((element, index) => {
                    const channels = Object.getOwnPropertyDescriptor(data, element).value;
                    if (channels.length > 0) {
                      channels.forEach(val => {
                        const amount = parseFloat(element);
                        const formattedData = {
                          amount,
                          channel: val,
                          type: ''
                        };
                        if (val === 'VipChannel') {
                          datas.push({
                            amount,
                            channel:  'VIP - AliPayQR',
                            type: 'AliPayQR'
                          });
                          datas.push({
                            amount,
                            channel:  'VIP - WeChatQR',
                            type: 'WeChatQR'
                          });
                          datas.push({
                            amount,
                            channel:  'VIP - AliPayAccount',
                            type: 'AliPayAccount'
                          });
                          datas.push({
                            amount,
                            channel:  'VIP - BankCard',
                            type: 'BankCard'
                          });
                        } else {
                          datas.push(formattedData);
                        }
                      });
                    }
                  });
                };
                if (!Utility.isEmpty(this.amountSearch)) { datas = this.filterResult(datas); };
                return datas;
              }
            )
          );
        }
      )
    ).subscribe(resp => {
      this.channelList = resp;
    });
  }

  filterResult(datas) {
    return datas.filter(data =>
      data.amount.toString().indexOf(this.amountSearch) > -1);
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
        const errorMsg = res.error && res.error.messages[0] ? res.error.messages[0] : 'Something went wrong';
        Swal.fire({
          html: errorMsg,
          icon: 'error'
        });
        return throwError(JSON.stringify(res));
      })
    ).subscribe(resp => {
      this.openModal(resp);
    });
  }

  openModal(response) {
    const modalRef = this.modalService.open(ResponseModalComponent, { size: 'sm' });
    modalRef.componentInstance.data = response;
  }

  sendVip(item, type) {
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
      resp.type = type;
      this.openModal(resp);
    });
  }

  customComparator(itemA, itemB) {
    const sortOrder = JSON.parse(localStorage.getItem('arrangement')).reverse();
    return sortOrder.indexOf(itemB) - sortOrder.indexOf(itemA);
  }

}
