import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ResponseModalComponent} from './response-modal/response-modal.component';

@NgModule({
  declarations: [
    ResponseModalComponent
  ],
  imports: [
    CommonModule
  ],
  entryComponents: [
    ResponseModalComponent
  ],
  exports: [
    ResponseModalComponent
  ]
})
export class ModalsModule { }
