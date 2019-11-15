import { Component, OnInit } from '@angular/core';
import {CommonService} from '../../../core/common/common.service';
import {ColumnMode} from '@swimlane/ngx-datatable';

@Component({
  selector: 'app-deposit-record-tab',
  templateUrl: './deposit-record-tab.component.html',
  styleUrls: ['./deposit-record-tab.component.css']
})
export class DepositRecordTabComponent implements OnInit {
  ColumnMode = ColumnMode;
  loading = false;
  columns = [
    { prop: 'amount' },
    { prop: 'channel' },
    { prop: 'systemReference' },
    { prop: 'updateTime'},
    { prop: 'status' }
  ];
  rows = [];
  page = {
    size : 5,
    sort : 'desc',
    prop : 'updateTime',
    totalElements: 0,
    pageNumber: 0
  };


  constructor(
    private commonService: CommonService
  ) { }

  ngOnInit() {
    this.search();
    this.setPage({ offset: 0 });
  }

  search() {
    this.loading = true;
    const query = `${this.page.prop},${this.page.sort}&page=${this.page.pageNumber}&size=${this.page.size}`;
    this.commonService.retrievePaymentList([], query, false).subscribe(resp => {
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
    this.search();
  }

  onSort(event) {
    console.log('Sort Event', event);
    const sort = event.sorts[0];
    this.page.prop = sort.prop === 'channel' ? 'paymentConfig.channel' : sort.prop;
    this.page.sort = sort.dir;
    this.search();
  }

}
