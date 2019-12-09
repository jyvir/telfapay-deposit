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
import {Router} from '@angular/router';
import * as $ from 'jquery';

@Component({
  selector: 'app-search-tab',
  templateUrl: './search-tab.component.html',
  styleUrls: ['./search-tab.component.css']
})
export class SearchTabComponent implements OnInit {
  amountSearch = '';
  vipEnabled: boolean;
  channelList = [];
  columns: number;
  constructor(
    public router: Router,
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
    this.vipEnabled = localStorage.getItem('vip_enabled') === 'true';
    $('.next-icon').hide();
    this.channelList = [];
    if (!Utility.isEmpty(this.amountSearch)) {
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
                          const amount = parseFloat(val.amount);
                          const formattedData = {
                            amount,
                            channel: element,
                            type: '',
                            channels : val.channel
                          };
                          let find = [];
                          if (val === 'VipChannel' && this.vipEnabled) {
                            find = datas.filter(x => x.channel === 'VIP - AliPayQR'
                              &&  x.amount ===  formattedData.amount);
                            if (find.length === 0) {
                              datas.push({
                                amount,
                                channel:  'VIP - AliPayQR',
                                type: 'AliPayQR'
                              });
                            }
                            find = datas.filter(x => x.channel === 'VIP - WeChatQR'
                              &&  x.amount ===  formattedData.amount);
                            if (find.length === 0) {
                              datas.push({
                                amount,
                                channel:  'VIP - WeChatQR',
                                type: 'WeChatQR'
                              });
                            }
                            find = datas.filter(x => x.channel === 'VIP - AliPayAccount'
                              &&  x.amount ===  formattedData.amount);
                            if (find.length === 0) {
                              datas.push({
                                amount,
                                channel:  'VIP - AliPayAccount',
                                type: 'AliPayAccount'
                              });
                            }
                            find = datas.filter(x => x.channel === 'VIP - BankCard'
                              &&  x.amount ===  formattedData.amount);
                            if (find.length === 0) {
                              datas.push({
                                amount,
                                channel:  'VIP - BankCard',
                                type: 'BankCard'
                              });
                            }
                          } else {
                            find = datas.filter(x => x.channel === formattedData.channel
                              &&  x.amount ===  formattedData.amount);
                            if (find.length === 0) {
                              datas.push(formattedData);
                            }
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
  }

  filterResult(datas) {
    let result = datas.filter(data => data.amount === parseFloat(this.amountSearch));
    if (Utility.isEmpty(result)) {
      result =  datas.filter(data =>
        data.amount >= (parseFloat(this.amountSearch) - 10) && data.amount <= (parseFloat(this.amountSearch) + 10)
      );
    }
    return result;
  }

  send(item) {
    const ref = moment().format('YYYYMMDDHHmmss');
    const payload = {
      login_name: this.cookie.get('username'),
      product_id: this.cookie.get('product_id'),
      amount: item.amount,
      channel: item.channel,
      sign: '',
      payment_reference: ref,
      ip: this.cookie.get('ip'),
      product_ip: this.cookie.get('productIp')
    };
    const req = Utility.generateSign(payload);
    if (item.channels.length > 1) {
      const data = {
        hasMoreChannel: true,
        payload,
        channels: item.channels
      };
      this.openModal(data);
    } else {
      this.commonService.sendPayment('', req).pipe(
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
        this.openModal(resp);
      });
    }
  }

  openModal(response) {
    const modalRef = this.modalService.open(ResponseModalComponent);
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
      payment_reference: ref,
      ip: this.cookie.get('ip'),
      product_ip: this.cookie.get('productIp')
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
      resp.type = type;
      this.openModal(resp);
    });
  }

  customComparator(itemA, itemB) {
    const sortOrder = JSON.parse(localStorage.getItem('arrangement')).reverse();
    return sortOrder.indexOf(itemB) - sortOrder.indexOf(itemA);
  }

  addNext() {
    $('.next-icon').show();
  }


}
