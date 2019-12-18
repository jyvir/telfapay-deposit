import {AfterViewInit, ChangeDetectorRef, Component, EventEmitter, Inject, OnInit, Output} from '@angular/core';
import {CommonService} from '../../../core/common/common.service';
import {catchError, flatMap, groupBy, map, mergeMap} from 'rxjs/operators';
import {PageListModel} from '../../../shared/models/page-list.model';
import {Utility} from '../../../shared/helpers/utility';
import {HttpErrorResponse} from '@angular/common/http';
import Swal from "sweetalert2";
import {empty, EMPTY, forkJoin, Observable, throwError} from 'rxjs';
import * as moment from 'moment';
import {ResponseModalComponent} from '../../modals/response-modal/response-modal.component';
import {CookieService} from 'ngx-cookie-service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {DOCUMENT} from '@angular/common';
import {Router} from '@angular/router';
import * as $ from 'jquery';
import {EMPTY_ARRAY} from '@angular/core/src/view';

@Component({
  selector: 'app-recommend-tab',
  templateUrl: './recommend-tab.component.html',
  styleUrls: ['./recommend-tab.component.css']
})
export class RecommendTabComponent implements OnInit, AfterViewInit {
  @Output() onHide = new EventEmitter<boolean>();
  channelList = [];
  columns: number;
  arrangement: any;
  vipEnabled: boolean;
  loading: boolean;
  constructor(
    public router: Router,
    private commonService: CommonService,
    public cookie: CookieService,
    private modalService: NgbModal,
    private cdr: ChangeDetectorRef
  ) {
  }

  ngOnInit() {
    this.loading = true;
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
        return this.commonService.retrievePaymentList({status: 'OK', channel: 'VipChannel'}, 'updateTime,desc&page=0&size=5', true);
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
          return this.commonService.retrieveRecommended().pipe(
            map(
              data => {
                const datas = [];
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
                      if (paymentList.length > 0 && element === 'VipChannel' && this.vipEnabled) {
                        const findItem = paymentList.find(item => {
                          if (item.channel === element && parseFloat(val.amount) === item.amount) {
                            formattedData.type  = item.agentType;
                            formattedData.channel = `VIP - ${item.agentType}`;
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
                      } else if (element !== 'VipChannel') {
                        datas.push(formattedData);
                      }
                    });
                  }
                });
                return datas;
              }
            )
          );
        }
      )
    ).subscribe(resp => {
        this.channelList = resp;
        this.loading = false;
      }, error => {
        this.loading = false;
      }
    );
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
      this.openModal(data);
    } else {
      if (item.channels) {
        payload.channel = item.channels[0];
      }
      const req = Utility.generateSign(payload);
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
        this.loading = false;
        this.openModal(resp);
      });
    }
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

  ngAfterViewInit(): void {
    this.cdr.detectChanges();
  }

}
