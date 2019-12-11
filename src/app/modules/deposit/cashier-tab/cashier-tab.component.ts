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
import {ResponseModalComponent} from '../../modals/response-modal/response-modal.component';
import {Router} from '@angular/router';
import * as $ from 'jquery';

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

  constructor(
    public router: Router,
    private commonService: CommonService,
    private cookie: CookieService,
    private modalService: NgbModal
  ) { }

  ngOnInit() {
    this.columns = Number(this.cookie.get('columns'));
  }

  fetchConfig(id) {
    const includedChannel = JSON.parse(localStorage.getItem('arrangement'));
    $('.next-icon').hide();
    this.channelList = [];
    this.commonService.retrieveConfig(id).pipe(
      map(data => {
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
      }),
      catchError(err => {
        console.log(err);
        return EMPTY;
      })
    ).subscribe(
      res => {
        this.channelList = res;
      }
    );
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

  customComparator(itemA, itemB) {
    const sortOrder = JSON.parse(localStorage.getItem('arrangement')).reverse();
    return sortOrder.indexOf(itemB) - sortOrder.indexOf(itemA);
  }

  addNext() {
      $('.next-icon').show();
  }
}
