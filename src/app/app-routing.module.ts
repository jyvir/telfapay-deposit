import {ExtraOptions, RouterModule, Routes} from '@angular/router';
import {DepositComponent} from './modules/deposit/deposit.component';
import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';

const routes: Routes = [
    {path: '', component: DepositComponent}
  ]

const PAGES_COMPONENTS = [
    DepositComponent
  ]

const config: ExtraOptions = {
  scrollPositionRestoration: 'enabled',
  anchorScrolling: 'enabled'
};

@NgModule({
  imports: [
    RouterModule.forRoot(routes, config),
    CommonModule
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
