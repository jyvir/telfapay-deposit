import { Component, OnInit } from '@angular/core';
import {CommonService} from '../../../core/common/common.service';
import {catchError, flatMap, groupBy, mergeMap} from 'rxjs/operators';
import {PageListModel} from '../../../shared/models/page-list.model';
import {Utility} from '../../../shared/helpers/utility';
import {HttpErrorResponse} from '@angular/common/http';
import Swal from "sweetalert2";
import {Observable, throwError} from 'rxjs';
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
  aliGrp = [];
  weChatGrp = [];
  jdGrp = [];
  kjGrp = [];
  unionGrp = [];
  qqGrp = [];
  visaGrp = [];
  bankGrp = [];
  btcGrp = [];

  constructor(
    private commonService: CommonService,
    private cookie: CookieService,
    private modalService: NgbModal
  ) { }

  ngOnInit() {
    this.channelList = [];
    this.aliGrp = [];
    this.weChatGrp = [];
    this.jdGrp = [];
    this.kjGrp = [];
    this.unionGrp = [];
    this.qqGrp = [];
    this.visaGrp = [];
    this.bankGrp = [];
    this.btcGrp = [];
    let index = 0;
    this.commonService.retrievePaymentList([], 'updateTime,desc', true).pipe(
      mergeMap((resp: any) => {
          if (resp.content.length !== 0) {
            for (const data of resp.content) {
              index++;
              if (!['BANK', 'MERCHANT', 'INTERNAL', 'AlipayQR'].includes(data.channel)) {
                this.groupByChannel({
                  channel: data.channel,
                  amount: data.amount
                });
              }
              if (index === 4) { break; }
            }
            return resp;
          }
        }
      )
    ).subscribe();
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
