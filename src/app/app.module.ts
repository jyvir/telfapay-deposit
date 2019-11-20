import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import {AppRoutingModule} from './app-routing.module';
import {CoreModule} from './core/core.module';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {HttpClientModule} from '@angular/common/http';
import {CookieService} from 'ngx-cookie-service';
import {ModalsModule} from './modules/modals/modals.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {OrderModule, OrderPipe} from "ngx-order-pipe";

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgbModule,
    CoreModule,
    HttpClientModule,
    ModalsModule
  ],
  providers: [
    CookieService
  ],
  exports: [
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
