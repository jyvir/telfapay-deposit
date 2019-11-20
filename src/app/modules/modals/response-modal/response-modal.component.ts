import {Component, Input, OnInit} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {Utility} from '../../../shared/helpers/utility';
import {ClipboardService} from 'ngx-clipboard';

@Component({
  selector: 'app-response-modal',
  templateUrl: './response-modal.component.html',
  styleUrls: ['./response-modal.component.css']
})
export class ResponseModalComponent implements OnInit {
  @Input() public data;
  constructor(
    public activeModal: NgbActiveModal,
    private clipboardService: ClipboardService
  ) { }

  ngOnInit() {
    if (this.data.type === 'AliPayAccount' || this.data.type === 'BankCard') {
      this.data.bankAccount = this.data.accountId;
      this.data.bankAccountName = this.data.accountOwner;
    }
  }

  copy(val) {
    this.clipboardService.copyFromContent(val);
  }

  openNewTab() {
    const newTab = window.open();
    if (this.data.type.includes('QR') && this.data.type !== 'QR_CODE') {
      newTab.document.body.innerHTML = `<img src="data:image/png;base64,${this.data.base64}" >`;
    } else if (this.data.type === 'HTML' || this.data.type ===  'FORM_DOC') {
      newTab.document.write(this.data.content);
    } else {
      newTab.open(this.data.content, '_blank');
    }
  }

}
