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
import {log} from 'util';

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
    public cookie: CookieService,
    private modalService: NgbModal
  ) {
    this.initData();
  }

  ngOnInit() {
    this.columns = Number(this.cookie.get('columns'));
  }

  initData() {
    const includedChannel = JSON.parse(this.cookie.get('arrangement'));
    this.vipEnabled = this.cookie.get('vip_enabled') === 'true';
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
                      if (channels.length > 0  && includedChannel.includes(element)) {
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
    const amount = parseFloat(this.amountSearch);
    const result = datas.filter(data => data.amount === parseFloat(this.amountSearch));
    if (Utility.isEmpty(result)) {
        const distinctChannel = [];
        datas.forEach(item => {
          if (!distinctChannel.includes(item.channel)) {
            distinctChannel.push(item.channel);
          }
        });
        let firstVal = null;
        let secondVal = null;
        distinctChannel.forEach( item => {
          firstVal = null;
          secondVal = null;
          let currChannel = datas.filter( res => res.channel === item);
          firstVal = currChannel.reduce( (prev, curr) => {
            return (Math.abs(curr.amount - amount) < Math.abs(prev.amount - amount) ? curr : prev);
          });
          currChannel = currChannel.filter(res => res.amount !== firstVal.amount);
          secondVal = currChannel.reduce( (prev, curr) => {
            return (Math.abs(curr.amount - amount) < Math.abs(prev.amount - amount) ? curr : prev);
          });
          if (firstVal && firstVal.amount > 0) {
            result.push(firstVal);
          }
          if (secondVal && secondVal.amount > 0) {
            result.push(secondVal);
          }
        });
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
      product_ip: this.cookie.get('productIp'),
      prepayment_url: this.cookie.get('prepayment_url') ? this.cookie.get('prepayment_url') : '',
      device_id: this.cookie.get('device_id') ? this.cookie.get('device_id') : ''
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
    let value: any;
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    value = ca.find(val => val.includes('arrangement'));
    value = value ? JSON.parse(value.replace('arrangement=', '')) : [];
    const sortOrder = value.reverse();
    return sortOrder.indexOf(itemB) - sortOrder.indexOf(itemA);
  }

  addNext() {
    $('.next-icon').show();
  }


}
