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

  groups = {
    aliGrp: [],
    weChatGrp: [],
    unionGrp: [],
    qqGrp: [],
    jdGrp: [],
    kjGrp: [],
    visaGrp: [],
    bankGrp: [],
    btcGrp: [],
    vipGrp: []
  };
  amountSearch = '';

  amountList = [];
  constructor(
    private commonService: CommonService,
    private cookie: CookieService,
    private modalService: NgbModal
  ) { }

  ngOnInit() {
    this.initData();
  }

  initData() {
    this.groups.aliGrp = [];
    this.groups.weChatGrp = [];
    this.groups.jdGrp = [];
    this.groups.kjGrp = [];
    this.groups.unionGrp = [];
    this.groups.qqGrp = [];
    this.groups.visaGrp = [];
    this.groups.bankGrp = [];
    this.groups.btcGrp = [];
    this.groups.vipGrp = [];
    this.commonService.retrieveConfigList().pipe(
      mergeMap(
        (resp: any) => {
          const calls = [];
          Object.keys(resp).forEach((element, index) => {
            calls.push(this.commonService.retrieveConfig(element));
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
              channels.forEach(val => {
                const formattedData = {
                  amount: element,
                  channel: val
                };
                this.groupByChannel(formattedData);
              });
            }
          });
        };
        if (!Utility.isEmpty(this.amountSearch)) { this.filterResult(); };
      }
    );
  }


  groupByChannel(data) {
    switch (data.channel) {
      case 'AliPay': case 'AliPayH5': case 'ALI': case 'AlipayQR':
        this.groups.aliGrp.push(data);
        break;
      case 'WeChat': case 'WeChatH5': case 'WE_CHAT': case 'WeChatPublic':
        this.groups.weChatGrp.push(data);
        break;
      case 'UnionPay': case 'UnionPayH5':
        this.groups.unionGrp.push(data);
        break;
      case 'QQWallet': case 'QQWallet':
        this.groups.qqGrp.push(data);
        break;
      case 'JD': case 'JDH5':
        this.groups.jdGrp.push(data);
        break;
      case 'KJ': case 'KJH5':
        this.groups.kjGrp.push(data);
        break;
      case 'VISAQR': case 'VISA':
        this.groups.visaGrp.push(data);
        break;
      case 'OFFLINE_BANK':
      case 'NetBank':
      case 'INTERNAL':
      case 'MERCHANT':
        this.groups.bankGrp.push(data);
        break;
      case 'BTC':
        this.groups.btcGrp.push(data);
        break;
      case 'VipChannel':
        this.groups.vipGrp.push(data);
        break;
    }
  }

  filterResult() {

    this.groups.aliGrp = this.groups.aliGrp.filter(data => data.amount.indexOf(this.amountSearch) > -1);
    this.groups.weChatGrp = this.groups.weChatGrp.filter(data => data.amount.indexOf(this.amountSearch) > -1);
    this.groups.jdGrp = this.groups.jdGrp.filter(data => data.amount.indexOf(this.amountSearch) > -1);
    this.groups.kjGrp = this.groups.kjGrp.filter(data => data.amount.indexOf(this.amountSearch) > -1);
    this.groups.unionGrp = this.groups.unionGrp.filter(data => data.amount.indexOf(this.amountSearch) > -1);
    this.groups.qqGrp = this.groups.qqGrp.filter(data => data.amount.indexOf(this.amountSearch) > -1);
    this.groups.visaGrp = this.groups.visaGrp.filter(data => data.amount.indexOf(this.amountSearch) > -1);
    this.groups.bankGrp = this.groups.bankGrp.filter(data => data.amount.indexOf(this.amountSearch) > -1);
    this.groups.btcGrp = this.groups.btcGrp.filter(data => data.amount.indexOf(this.amountSearch) > -1);
    this.groups.vipGrp = this.groups.vipGrp.filter(data => data.amount.indexOf(this.amountSearch) > -1);
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

}
