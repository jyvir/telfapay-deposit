import {AfterViewInit, ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {CommonService} from '../../../core/common/common.service';
import {catchError, map} from 'rxjs/operators';
import {CookieService} from 'ngx-cookie-service';
import {Utility} from '../../../shared/helpers/utility';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import * as moment from 'moment';
import {EMPTY, Observable, throwError} from 'rxjs';
import {HttpErrorResponse} from '@angular/common/http';
import {ResponseModalComponent} from '../../modals/response-modal/response-modal.component';
import {Router} from '@angular/router';
import * as $ from 'jquery';
import {parseCookieValue} from '@angular/common/src/cookie';
import {ɵparseCookieValue} from '@angular/common';
import {log} from 'util';
import * as cookies from 'cookie';
import {environment} from '../../../../environments/environment';
import * as ext from '../../../../assets/js/external.js';

@Component({
  selector: 'app-cashier-tab',
  templateUrl: './cashier-tab.component.html',
  styleUrls: ['./cashier-tab.component.css']
})
export class CashierTabComponent implements OnInit, AfterViewInit {
  channelList = [];
  aliGrp = [];
  weChatGrp = [];
  jdGrp = [];
  kjGrp = [];
  unionGrp = [];
  qqGrp = [];
  visaGrp = [];
  bankGrp = [];
  btcGrp = [];
  columns: number;
  loading: boolean;

  constructor(
    public router: Router,
    private commonService: CommonService,
    private cookie: CookieService,
    private modalService: NgbModal,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.columns = Number(this.cookie.get('columns'));
  }

  fetchConfig(id) {
    this.loading = true;
    const includedChannel = JSON.parse(this.cookie.get('arrangement'));
    $('.next-icon').hide();
    this.channelList = [];
    const firstConfig = Utility.isEmpty(this.cookie.get('first_config')) ? null : this.cookie.get('first_config');
    if (firstConfig) {
      this.cookie.set('first_config', '');
      this.channelList = this.formatDatas(JSON.parse(firstConfig), includedChannel);
      setTimeout(() => {
        this.loading = false;
      }, 500);
    } else {
      this.commonService.retrieveConfig(id).pipe(
        map(data => {
          const datas = this.formatDatas(data, includedChannel);
          return datas;
        }),
        catchError(err => {
          console.log(err);
          return EMPTY;
        })
      ).subscribe(
        res => {
          this.loading = false;
          this.channelList = res;
        },error => {
          this.loading = false;
        }
      );
    }
  }

  formatDatas(data, includedChannel) {
    const datas = [];
    Object.keys(data).forEach((element, index) => {
      const channels = Object.getOwnPropertyDescriptor(data, element).value;
      if (channels.length > 0 && includedChannel.includes(element) && element !== 'VipChannel') {
        channels.forEach(val => {
          const formattedData = {
            amount: parseFloat(val.amount),
            channel: element,
            channels: val.channel
          };
          datas.push(formattedData);
        });
      }
    });
    return datas;
  }

  groupByChannel(data) {
    switch (data.channel) {
      case 'AliPay': case 'AliPayH5': case 'ALI': case 'AlipayQR':
        this.aliGrp.push(data);
        break;
      case 'WeChat': case 'WeChatH5': case 'WE_CHAT': case 'WeChatPublic':
        this.weChatGrp.push(data);
        break;
      case 'UnionPay': case 'UnionPayH5':
        this.unionGrp.push(data);
        break;
      case 'QQWallet': case 'QQWallet':
        this.qqGrp.push(data);
        break;
      case 'JD': case 'JDH5':
        this.jdGrp.push(data);
        break;
      case 'KJ': case 'KJH5':
        this.kjGrp.push(data);
        break;
      case 'VISAQR': case 'VISA':
        this.visaGrp.push(data);
        break;
      case 'OFFLINE_BANK':
      case 'NetBank':
      case 'INTERNAL':
      case 'MERCHANT':
        this.bankGrp.push(data);
        break;
      case 'BTC':
        this.btcGrp.push(data);
        break;
    }
  }

  ngAfterViewInit(): void {
    this.loading = true;
    this.cdr.detectChanges();
  }

  send(item) {
    this.loading = true;
    const ref = moment().format('YYYYMMDDHHmmss');
    const payload = {
      login_name: this.cookie.get('username'),
      product_id: this.cookie.get('product_id'),
      amount: item.amount,
      channel: item.channels,
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
