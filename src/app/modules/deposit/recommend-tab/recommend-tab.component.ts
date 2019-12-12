import {AfterViewInit, Component, EventEmitter, Inject, OnInit, Output} from '@angular/core';
import {CommonService} from '../../../core/common/common.service';
import {catchError, flatMap, groupBy, map, mergeMap} from 'rxjs/operators';
import {PageListModel} from '../../../shared/models/page-list.model';
import {Utility} from '../../../shared/helpers/utility';
import {HttpErrorResponse} from '@angular/common/http';
import Swal from "sweetalert2";
import {forkJoin, Observable, throwError} from 'rxjs';
import * as moment from 'moment';
import {ResponseModalComponent} from '../../modals/response-modal/response-modal.component';
import {CookieService} from 'ngx-cookie-service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {DOCUMENT} from '@angular/common';
import {Router} from '@angular/router';
import * as $ from 'jquery';

@Component({
  selector: 'app-recommend-tab',
  templateUrl: './recommend-tab.component.html',
  styleUrls: ['./recommend-tab.component.css']
})
export class RecommendTabComponent implements OnInit {
  @Output() onHide = new EventEmitter<boolean>();
  channelList = [];
  columns: number;
  arrangement: any;
  vipEnabled: boolean;
  constructor(
    public router: Router,
    private commonService: CommonService,
    public cookie: CookieService,
    private modalService: NgbModal
  ) {
  }

  ngOnInit() {
    let includedChannel: any;
    $('.next-icon').hide();
    this.channelList = [];
    let paymentList = [];
    this.commonService.retrieveConfigurations().pipe(
      mergeMap(resp => {
        this.cookie.set('announcement', resp.announcement);
        this.cookie.set('arrangement', JSON.stringify(resp.arrangement));
        this.cookie.set('vip_enabled', resp.vip_enabled);
        this.vipEnabled = resp.vip_enabled;
        this.columns = resp.columns;
        includedChannel = JSON.stringify(resp.arrangement);
        return this.commonService.retrievePaymentList({status: 'OK'}, 'updateTime,desc&page=0&size=5', true);
      }),
      mergeMap((resp: any) => {
        const calls = [];
        if (!Utility.isEmpty(resp)) {
          paymentList = resp.content;
        }
        calls.push(this.commonService.retrieveConfigList());
        for (const payment of paymentList) {
          if (payment.channel === 'VipChannel' ) {calls.push(this.commonService.retrieveAgentType(payment.id)); }
        }
        return forkJoin(calls);
        }
      ),
      mergeMap(
        resp => {
          let vipCount = 1;
          paymentList.forEach((data, index) => {
            if (data.channel === 'VipChannel' ) {
              data.agentType = resp[vipCount];
              vipCount++;
            }
          });
          const calls = [];
          Object.keys(resp[0]).forEach((element, index) => {
            calls.push(this.commonService.retrieveConfig(element));
            // calls.push(this.commonService.retrieveVipConfig(element));
          });
          return forkJoin(calls).pipe(
            map(
              dataList => {
                const datas = [];
                for (const data of dataList) {
                  Object.keys(data).forEach((element, index) => {
                    const channels = Object.getOwnPropertyDescriptor(data, element).value;
                    if (channels.length > 0 && includedChannel.includes(element)) {
                      channels.forEach(val => {
                        const formattedData = {
                          amount: val.amount,
                          channel: element,
                          type: '',
                          channels: val.channel
                        };
                        if (paymentList.length > 0) {
                          const findItem = paymentList.find(item => {
                            if (item.channel === element && parseFloat(val.amount) === item.amount) {
                              if (item.channel === 'VipChannel') {
                                if (this.vipEnabled) {
                                  formattedData.type  = item.agentType;
                                  formattedData.channel = `VIP - ${item.agentType}`;
                                } else {
                                  return null;
                                }
                              }
                              return item;
                            }
                          });
                          if (!Utility.isEmpty(findItem)) {
                            const find = datas.filter(x => x.channel === formattedData.channel
                              &&  parseFloat(x.amount) ===  parseFloat(formattedData.amount));
                            if (find.length === 0) {
                              datas.push(formattedData);
                            }
                          }
                        } else if (parseFloat(val.amount) < 500) {
                          const find = datas.filter(x => x.channel === formattedData.channel
                            &&  parseFloat(x.amount) ===  parseFloat(formattedData.amount));
                          if (find.length === 0) {
                            datas.push(formattedData);
                          }
                        }
                      });
                    }
                  });
                }
                return datas;
              }
            )
          );
        }
      )
    ).subscribe(resp => {
        this.channelList = resp;
      }
    );
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
