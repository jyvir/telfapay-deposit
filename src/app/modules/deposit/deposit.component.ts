import {AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {CommonService} from '../../core/common/common.service';
import {catchError, flatMap, map, mergeMap} from 'rxjs/operators';
import {throwError} from 'rxjs';
import {CookieService} from 'ngx-cookie-service';
import {Router} from '@angular/router';
import * as $ from 'jquery';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-deposit',
  templateUrl: './deposit.component.html',
  styleUrls: ['./deposit.component.css']
})
export class DepositComponent implements OnInit, AfterViewInit {

  private configChild: ElementRef;

  @ViewChild ('config') set content(content: ElementRef) {
    this.configChild = content;
    this.selectConfig(this.selectedId);
  }

  tab: any;
  isExpired: boolean;
  configList = [];
  selectedId: number;
  @ViewChild('nav') nav: ElementRef;
  @ViewChild('contentDiv') contentDiv: ElementRef;
  config: any;
  vipEnabled: boolean;
  isDataLoaded: boolean;


  constructor(
    public router: Router,
    private commonService: CommonService,
    private cookie: CookieService,
    private cdr: ChangeDetectorRef
  ) {
  }

  ngOnInit() {
    this.commonService.retrieveToken().pipe(
      mergeMap(value => {
        if (!value) {
          this.isExpired = true;
        } else {
          this.cookie.set('username', value.username);
          this.cookie.set('product_id', value.product_id);
          this.cookie.set('ip', value.ip ? value.ip : '');
          this.cookie.set('productIp', value.product_ip ? value.product_ip : '');
          this.cookie.set('device_id', value.device_id ? value.device_id : '');
        }
        return this.commonService.retrieveConfigurations();
      }),
      mergeMap(
        resp => {
          this.cookie.set('announcement', resp.announcement);
          this.cookie.set('arrangement', JSON.stringify(resp.arrangement));
          this.cookie.set('vip_enabled', resp.vip_enabled);
          this.cookie.set('cashier_script', resp.cashier_script);
          this.vipEnabled = resp.vip_enabled;
          return this.commonService.retrieveConfigList();
        }
      ),
      map(resp => resp),
      catchError(
        error => throwError(error.toString()
        ))
    ).subscribe(
      resp => {
        Object.keys(resp).forEach((element, index) => {
          const value = Object.getOwnPropertyDescriptor(resp, element).value;
          const data = {
            name: value,
            id: element
          };
          this.configList.push(data);
        });
        this.isDataLoaded = true;
        if (this.configList) {
          this.tab = 'cashier';
          this.selectConfig(this.configList[0].id);
        } else {
          this.tab = 'search';
        }
      },
      error1 => {
        this.isExpired = true;
        this.isDataLoaded = true;
        this.tab = 'search';
      }
    );
  }

  changeHide(val: boolean) {
    this.vipEnabled = val;
  }
  selectConfig(id) {
    this.selectedId = id;
    if (this.configChild) {
      // @ts-ignore
      this.configChild.fetchConfig(this.selectedId);
    }
  }

  openNav() {
    this.nav.nativeElement.style.width = '50%';
  }

  closeNav() {
    this.nav.nativeElement.style.width = '0';
  }

  public scrollRight(): void {
    $('.amount-cont').animate({
      scrollLeft: '+=200px'
    }, 'slow');
  }

  ngAfterViewInit(): void {
    this.cdr.detectChanges();
  }

}
