import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {TransactionService} from './transaction/transaction.service';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
  ],
  providers: [
    TransactionService
  ]
})
export class CoreModule { }
