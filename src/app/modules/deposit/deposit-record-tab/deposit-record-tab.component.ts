import { Component, OnInit } from '@angular/core';
import {CommonService} from '../../../core/common/common.service';
import {ColumnMode} from '@swimlane/ngx-datatable';
import {Utility} from "../../../shared/helpers/utility";
import {ClipboardService} from 'ngx-clipboard';
import {ToastrService} from 'ngx-toastr';

@Component({
  selector: 'app-deposit-record-tab',
  templateUrl: './deposit-record-tab.component.html',
  styleUrls: ['./deposit-record-tab.component.css']
})
export class DepositRecordTabComponent implements OnInit {
  ColumnMode = ColumnMode;
  loading = false;
  columns = [
    { name: 'Amount', prop: 'amount' },
    { name: 'Channel', prop: 'channel' },
    { name: 'Provider Reference', prop: 'providerReference' },
    { name: 'Update Time', prop: 'updateTime'},
    { name: 'Status', prop: 'status' },
    { name: '', prop: 'status'}
  ];
  rows = [];
  page = {
    size : 5,
    sort : 'desc',
    prop : 'updateTime',
    totalElements: 0,
    pageNumber: 0
  };

  mode: any;
  searchData: any;
  fromDate: any;
  toDate: any;
  isSearch = false;

  constructor(
    private commonService: CommonService,
    private clipboardService: ClipboardService,
    private toastr: ToastrService
  ) { }

  ngOnInit() {
    this.search(null);
    this.setPage({ offset: 0 });
  }

  search(mode) {
    this.mode = mode;
    if (mode) {
      this.isSearch = true;
      this.toDate = new Date();
    }

    switch (mode) {
      case 'day': {
        this.fromDate = new Date();
        break;
      }
      case 'week': {
        this.fromDate = new Date();
        this.fromDate.setDate(this.toDate.getDate() - 7);
        break;
      }
      case 'month': {
        this.fromDate = new Date();
        this.fromDate.setDate(this.toDate.getDate() - 31);
        break;
      }
      default: {
        break;
      }
    }


    if (mode) {
      this.searchData = Object.assign({},
        {
          'fromDate': Utility.formatDateFilter({'fromDate': this.fromDate}).fromDate,
          'toDate': this.toDate
        });
    }

    this.loading = true;
    const query = `${this.page.prop},${this.page.sort}&page=${this.page.pageNumber}&size=${this.page.size}`;
    this.commonService.retrievePaymentList(this.searchData, query, this.isSearch).subscribe(resp => {
      this.rows = resp.content;
      this.page.totalElements = resp.totalElements;
      this.page.pageNumber = resp.number;
      this.loading = false;
    }, error => {
      this.loading = false;
    });
  }

  setPage(pageInfo) {
    this.page.pageNumber = pageInfo.offset;
    this.search(null);
  }

  onSort(event) {
    console.log('Sort Event', event);
    const sort = event.sorts[0];
    this.page.prop = sort.prop === 'channel' ? 'paymentConfig.channel' : sort.prop;
    this.page.sort = sort.dir;
    this.search(null);
  }

  copy(val) {
    this.clipboardService.copyFromContent(val);
    this.toastr.success('已复制');
  }

  showRefresh() {
    this.toastr.success('已刷新');
  }

}
