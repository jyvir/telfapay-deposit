import { Component, OnInit } from '@angular/core';
import {CommonService} from '../../../core/common/common.service';
import {catchError, flatMap, groupBy, mergeMap} from 'rxjs/operators';
import {PageListModel} from '../../../shared/models/page-list.model';
import {Utility} from '../../../shared/helpers/utility';
import {HttpErrorResponse} from '@angular/common/http';
import Swal from "sweetalert2";
import {forkJoin, Observable, throwError} from 'rxjs';
import * as moment from 'moment';
import {ResponseModalComponent} from '../../modals/response-modal/response-modal.component';
import {CookieService} from 'ngx-cookie-service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-recommend-tab',
  templateUrl: './recommend-tab.component.html',
  styleUrls: ['./recommend-tab.component.css']
})
export class RecommendTabComponent implements OnInit {

  channelList = [];
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
    vipGrp: {
      weChatGrp: [],
      aliGrp: [],
      bankGrp: [],
      aliPayGrp: []
    }
  };
  agentTypes = [];

  constructor(
    private commonService: CommonService,
    private cookie: CookieService,
    private modalService: NgbModal
  ) { }

  ngOnInit() {
    this.channelList = [];
    this.groups.aliGrp = [];
    this.groups.weChatGrp = [];
    this.groups.jdGrp = [];
    this.groups.kjGrp = [];
    this.groups.unionGrp = [];
    this.groups.qqGrp = [];
    this.groups.visaGrp = [];
    this.groups.bankGrp = [];
    this.groups.btcGrp = [];
    this.groups.vipGrp.aliGrp = [];
    this.groups.vipGrp.weChatGrp = [];
    this.groups.vipGrp.bankGrp = [];
    this.groups.vipGrp.aliPayGrp = [];
    let paymentList = [];
    this.commonService.retrievePaymentList({status: 'OK'}, 'updateTime,desc&page=0&size=5', true).pipe(
      mergeMap((resp: any) => {
        const calls = [];
        paymentList = resp.content;
        calls.push(this.commonService.retrieveConfigList());
        for (const payment of paymentList) {
          if (payment.channel === 'VipChannel' ) {calls.push(this.commonService.retrieveAgentType(payment.id)); }
        }
        return forkJoin(calls);
        }
      ),
      mergeMap(
        resp => {
          paymentList.forEach((data, index) => {
            if (data.channel === 'VipChannel' ) {
              data.agentType = resp[index + 1];
            }
          })
          const calls = [];
          Object.keys(resp[0]).forEach((element, index) => {
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
                  channel: val,
                  type: ''
                };
                if (paymentList.length > 0) {
                  const findItem = paymentList.find(item => {
                    if (item.channel === val && parseFloat(element) === item.amount) {
                      if (item.channel === 'VipChannel') { formattedData.type  = item.agentType; }
                      return item;
                    }
                  });
                  if (!Utility.isEmpty(findItem)) {
                    this.groupByChannel(formattedData);
                  }
                } else if (parseFloat(element) < 500) {
                  this.groupByChannel(formattedData);
                }
              });
            }
          });
        }
      }
    );
  }

  groupByChannel(data) {
    if (data.channel === 'VipChannel') {
      data.channel = data.type;
    }
    switch (data.channel) {
      case 'AliPay': case 'AliPayH5': case 'ALI': case 'AlipayQR':
        if (this.groups.aliGrp.length < 5) {
          this.groups.aliGrp.push(data);
        }
        break;
      case 'WeChat': case 'WeChatH5': case 'WE_CHAT': case 'WeChatPublic':
        if (this.groups.weChatGrp.length < 5) {
          this.groups.weChatGrp.push(data);
        }
        break;
      case 'UnionPay': case 'UnionPayH5':
        if (this.groups.unionGrp.length < 5) {
          this.groups.unionGrp.push(data);
        }
        break;
      case 'QQWallet': case 'QQWallet':
        if (this.groups.qqGrp.length < 5) {
          this.groups.qqGrp.push(data);
        }
        break;
      case 'JD': case 'JDH5':
        if (this.groups.jdGrp.length < 5) {
          this.groups.jdGrp.push(data);
        }
        break;
      case 'KJ': case 'KJH5':
        if (this.groups.kjGrp.length < 5) {
          this.groups.kjGrp.push(data);
        }
        break;
      case 'VISAQR': case 'VISA':
        if (this.groups.visaGrp.length < 5) {
          this.groups.visaGrp.push(data);
        }
        break;
      case 'OFFLINE_BANK':
      case 'NetBank':
      case 'INTERNAL':
      case 'MERCHANT':
        if (this.groups.bankGrp.length < 5) {
          this.groups.bankGrp.push(data);
        }
        break;
      case 'BTC':
        if (this.groups.btcGrp.length < 5) {
          this.groups.btcGrp.push(data);
        }
        break;
      case 'WeChatQR':
        if (this.groups.vipGrp.weChatGrp.length < 5) {
          this.groups.vipGrp.weChatGrp.push(data);
        }
        break;
      case 'BankCard':
        if (this.groups.vipGrp.bankGrp.length < 5) {
          this.groups.vipGrp.bankGrp.push(data);
        }
        break;
      case 'AliPayAccount':
        if (this.groups.vipGrp.aliGrp.length < 5) {
          this.groups.vipGrp.aliGrp.push(data);
        }
        break;
      case 'AliPayQR':
        if (this.groups.vipGrp.aliPayGrp.length < 5) {
          this.groups.vipGrp.aliPayGrp.push(data);
        }
        break;
    }
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

  openModal(response) {
    const modalRef = this.modalService.open(ResponseModalComponent, { size: 'sm' });
    modalRef.componentInstance.data = response;
  }

}
