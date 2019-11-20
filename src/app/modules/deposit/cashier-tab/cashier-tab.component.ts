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

  constructor(
    private commonService: CommonService,
    private cookie: CookieService,
    private modalService: NgbModal
  ) { }

  ngOnInit() {

  }

  fetchConfig(id) {
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
    this.commonService.retrieveConfig(id).pipe(
      map(data => {
        Object.keys(data).forEach((element, index) => {
          const channels = Object.getOwnPropertyDescriptor(data, element).value;
          if (channels.length > 0) {
            channels.forEach(val => {
              const formattedData = {
                amount: parseFloat(element),
                channel: val
              };
              this.groupByChannel(formattedData);
            });
          }
        });
      })
    ).subscribe(
      error => {
        console.log(error);
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
