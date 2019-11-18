import { Component, OnInit } from '@angular/core';
import {CommonService} from '../../../core/common/common.service';
import {flatMap} from 'rxjs/operators';

@Component({
  selector: 'app-vip-tab',
  templateUrl: './vip-tab.component.html',
  styleUrls: ['./vip-tab.component.css']
})
export class VipTabComponent implements OnInit {

  constructor(
    private commonService: CommonService
  ) { }

  ngOnInit() {

  }

}
