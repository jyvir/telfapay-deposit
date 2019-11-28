import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ResponseModalComponent} from './response-modal/response-modal.component';
import {NgxQRCodeModule} from 'ngx-qrcode2';

@NgModule({
  declarations: [
    ResponseModalComponent
  ],
  imports: [
    CommonModule,
    NgxQRCodeModule
  ],
  entryComponents: [
    ResponseModalComponent
  ],
  exports: [
    ResponseModalComponent
  ]
})
export class ModalsModule { }
