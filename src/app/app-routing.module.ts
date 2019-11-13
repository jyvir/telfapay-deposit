import {ExtraOptions, RouterModule, Routes} from '@angular/router';
import {DepositComponent} from './modules/deposit/deposit.component';
import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {RecommendTabComponent} from './modules/deposit/recommend-tab/recommend-tab.component';
import {VipTabComponent} from './modules/deposit/vip-tab/vip-tab.component';
import {DepositRecordTabComponent} from './modules/deposit/deposit-record-tab/deposit-record-tab.component';
import {CashierTabComponent} from './modules/deposit/cashier-tab/cashier-tab.component';
import {NgMaterialIconModule} from 'ng-material-icon';

const routes: Routes = [
    {path: '', component: DepositComponent}
  ]

const PAGES_COMPONENTS = [
    DepositComponent,
    RecommendTabComponent,
    VipTabComponent,
    DepositRecordTabComponent,
    CashierTabComponent
  ]

const config: ExtraOptions = {
  scrollPositionRestoration: 'enabled',
  anchorScrolling: 'enabled'
};

@NgModule({
  imports: [
    RouterModule.forRoot(routes, config),
    CommonModule,
    NgMaterialIconModule
  ],
  exports: [
    RouterModule,
    NgbModule,
    PAGES_COMPONENTS
  ],
  declarations: [
    PAGES_COMPONENTS
  ]
})
export class AppRoutingModule { }
