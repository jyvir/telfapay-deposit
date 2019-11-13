import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-deposit',
  templateUrl: './deposit.component.html',
  styleUrls: ['./deposit.component.css']
})
export class DepositComponent implements OnInit {
  tab: any;

  constructor() { }

  ngOnInit() {
    this.tab = 'recommend';
  }


  changeTab(tab) {
    this.tab = tab;
  }
}
