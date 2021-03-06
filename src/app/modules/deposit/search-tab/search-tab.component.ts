import {AfterViewInit, ChangeDetectorRef, Component, OnInit} from '@angular/core';
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
import {environment} from '../../../../environments/environment';
import * as ext from '../../../../assets/js/external';

@Component({
  selector: 'app-search-tab',
  templateUrl: './search-tab.component.html',
  styleUrls: ['./search-tab.component.css']
})
export class SearchTabComponent implements OnInit, AfterViewInit {
  amountSearch = '';
  vipEnabled: boolean;
  channelList = [];
  columns: number;
  loading: boolean;
  constructor(
    public router: Router,
    private commonService: CommonService,
    public cookie: CookieService,
    private modalService: NgbModal,
    private cdr: ChangeDetectorRef
  ) {
    this.initData();
  }

  ngOnInit() {
    this.columns = Number(this.cookie.get('columns'));
  }

  initData() {
    const configIds = [];
    const includedChannel = JSON.parse(this.cookie.get('arrangement'));
    this.vipEnabled = this.cookie.get('vip_enabled') === 'true';
    $('.next-icon').hide();
    this.channelList = [];
    if (!Utility.isEmpty(this.amountSearch)) {
      this.loading = true;
      this.commonService.retrieveConfigList().pipe(
        mergeMap(
          (resp: any) => {
            const calls = [];
            Object.keys(resp).forEach((element, index) => {
              calls.push(this.commonService.retrieveConfig(element));
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
        this.loading = false;
      },error => {
        this.loading = false;
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
    this.loading = true;
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
      device_id: this.cookie.get('device_id') ? this.cookie.get('device_id') : ''
    };
    if (item.channels && item.channels.length > 1) {
      const data = {
        hasMoreChannel: true,
        payload,
        channels: item.channels
      };
      this.loading = false;
      this.openModal(data);
    } else {
      if (item.channels) {
        payload.channel = item.channels[0];
      }
      const req = Utility.generateSign(payload);
      if (payload.channel !== 'OFFLINE_BANK' && this.cookie.get('cashier_script') === 'true') {
        const token = this.cookie.get('token');
        ext.call(`${environment.cashier_api}/cashier/deposit-get?${req}&token=${token}`);
        this.loading = false;
        return true;
      }
      this.commonService.sendPayment('', req).pipe(
        catchError((res: HttpErrorResponse) => {
          this.loading = false;
          let errorMsg = res.error && res.error.messages && res.error.messages[0] ? res.error.messages[0] : 'Something went wrong';
          errorMsg = Utility.manualTranslateErrorMsg(errorMsg);
          Swal.fire({
            html: errorMsg,
            icon: 'error'
          });
          return throwError(JSON.stringify(res));
        })
      ).subscribe(resp => {
        if ((resp.type === 'FORM_DOC' || resp.type === 'HTML') && resp.content.includes('http://')) {
          window.document.write(resp.content);
        } else if ((resp.type === 'REDIRECT') && resp.content.startsWith('http://')) {
          window.location.href = resp.content;
        } else {
          this.loading = false;
          this.openModal(resp);
        }
      });
    }
  }

  openModal(response) {
    const modalRef = this.modalService.open(ResponseModalComponent);
    modalRef.componentInstance.data = response;
  }

  sendVip(item, type) {
    this.loading = true;
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
        this.loading = false;
        let errorMsg = res.error && res.error.messages && res.error.messages[0] ? res.error.messages[0] : 'Something went wrong';
        errorMsg = Utility.manualTranslateErrorMsg(errorMsg);
        Swal.fire({
          html: errorMsg,
          icon: 'error'
        });
        return throwError(JSON.stringify(res));
      })
    ).subscribe(resp => {
      this.loading = false;
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

  ngAfterViewInit(): void {
    this.cdr.detectChanges();
  }


}
