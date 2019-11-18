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

  aliGrp = [];
  weChatGrp = [];
  jdGrp = [];
  kjGrp = [];
  unionGrp = [];
  qqGrp = [];
  visaGrp = [];
  bankGrp = [];
  btcGrp = [];
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
    this.aliGrp = [];
    this.weChatGrp = [];
    this.jdGrp = [];
    this.kjGrp = [];
    this.unionGrp = [];
    this.qqGrp = [];
    this.visaGrp = [];
    this.bankGrp = [];
    this.btcGrp = [];
    this.commonService.retrieveConfigList().pipe(
      mergeMap(
        (resp: any) => {
          const calls = [];
          Object.keys(resp).forEach((element, index) => {
            calls.push(this.commonService.retrieveConfig(element));
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

  filterResult() {

    this.aliGrp = this.aliGrp.filter(data => data.amount.indexOf(this.amountSearch) > -1);
    this.weChatGrp = this.weChatGrp.filter(data => data.amount.indexOf(this.amountSearch) > -1);
    this.jdGrp = this.jdGrp.filter(data => data.amount.indexOf(this.amountSearch) > -1);
    this.kjGrp = this.kjGrp.filter(data => data.amount.indexOf(this.amountSearch) > -1);
    this.unionGrp = this.unionGrp.filter(data => data.amount.indexOf(this.amountSearch) > -1);
    this.qqGrp = this.qqGrp.filter(data => data.amount.indexOf(this.amountSearch) > -1);
    this.visaGrp = this.visaGrp.filter(data => data.amount.indexOf(this.amountSearch) > -1);
    this.bankGrp = this.bankGrp.filter(data => data.amount.indexOf(this.amountSearch) > -1);
    this.btcGrp = this.btcGrp.filter(data => data.amount.indexOf(this.amountSearch) > -1);
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

}
