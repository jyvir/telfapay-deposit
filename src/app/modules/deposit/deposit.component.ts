import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {CommonService} from '../../core/common/common.service';
import {catchError, map, mergeMap} from 'rxjs/operators';
import {throwError} from 'rxjs';
import {CookieService} from 'ngx-cookie-service';

@Component({
  selector: 'app-deposit',
  templateUrl: './deposit.component.html',
  styleUrls: ['./deposit.component.css']
})
export class DepositComponent implements OnInit {

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


  constructor(
    private commonService: CommonService,
    private cookie: CookieService
  ) { }

  ngOnInit() {
    this.commonService.retrieveToken().pipe(
      mergeMap(value => {
        if (!value) {
          this.isExpired = true;
        } else {
          this.cookie.set('username', value.username);
          this.cookie.set('product_id', value.product_id);
        }
        return this.commonService.retrieveConfigList();
      }),
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
          }
          this.configList.push(data);
        });
      },
      error1 => {
        this.isExpired = true;
      }
    )
    this.tab = 'recommend';
  }


  selectConfig(id) {
    this.selectedId = id;
    if (this.configChild) {
      // @ts-ignore
      this.configChild.fetchConfig(this.selectedId);
    }
  }

  openNav() {
    this.nav.nativeElement.style.width = '100%';
  }

  closeNav() {
    this.nav.nativeElement.style.width = '0';
  }
}
