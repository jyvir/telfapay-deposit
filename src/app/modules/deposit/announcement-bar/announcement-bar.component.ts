import { Component, OnInit } from '@angular/core';
import {CommonService} from '../../../core/common/common.service';
import {CookieService} from 'ngx-cookie-service';

@Component({
  selector: 'app-announcement-bar',
  templateUrl: './announcement-bar.component.html',
  styleUrls: ['./announcement-bar.component.css']
})
export class AnnouncementBarComponent implements OnInit {
  announcement: string;

  constructor(
    private cookie: CookieService
  ) { }

  ngOnInit() {
    this.announcement = localStorage.getItem('announcement');
  }

}
