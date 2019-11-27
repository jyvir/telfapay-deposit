import {Component, Inject, OnInit} from '@angular/core';
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

@Component({
  selector: 'app-recommend-tab',
  templateUrl: './recommend-tab.component.html',
  styleUrls: ['./recommend-tab.component.css']
})
export class RecommendTabComponent implements OnInit {

  channelList = [];
  columns: number;
  arrangement: any;
  constructor(
    public router: Router,
    private commonService: CommonService,
    private cookie: CookieService,
    private modalService: NgbModal
  ) {
  }

  ngOnInit() {
    this.channelList = [];
    let paymentList = [];
    this.commonService.retrieveConfigurations().pipe(
      mergeMap(resp => {
        this.cookie.set('announcement', resp.announcement);
        this.cookie.set('columns', resp.columns);
        localStorage.setItem('arrangement', JSON.stringify(resp.arrangement));
        localStorage.setItem('announcement', resp.announcement);

        this.columns = resp.columns;
        return this.commonService.retrievePaymentList({status: 'OK'}, 'updateTime,desc&page=0&size=5000', true);
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
          })
          const calls = [];
          Object.keys(resp[0]).forEach((element, index) => {
            calls.push(this.commonService.retrieveConfig(element));
            calls.push(this.commonService.retrieveVipConfig(element));
          });
          return forkJoin(calls).pipe(
            map(
              dataList => {
                const datas = [];
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
                              if (item.channel === 'VipChannel') {
                                formattedData.type  = item.agentType;
                                formattedData.channel = `VIP - ${item.agentType}`;
                              }
                              return item;
                            }
                          });
                          if (!Utility.isEmpty(findItem)) {
                            datas.push(formattedData);
                          }
                        } else if (parseFloat(element) < 500) {
                          datas.push(formattedData);
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
      payment_reference: ref
    };
    const req = Utility.generateSign(payload);
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
    const modalRef = this.modalService.open(ResponseModalComponent, { size: 'sm' });
    modalRef.componentInstance.data = response;
  }

  customComparator(itemA, itemB) {
    const sortOrder = JSON.parse(localStorage.getItem('arrangement')).reverse();
    return sortOrder.indexOf(itemB) - sortOrder.indexOf(itemA);
  }

}
