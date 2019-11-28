import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {Utility} from '../../../shared/helpers/utility';
import {ClipboardService} from 'ngx-clipboard';
import {DomSanitizer} from '@angular/platform-browser';
import * as $ from 'jquery';

@Component({
  selector: 'app-response-modal',
  templateUrl: './response-modal.component.html',
  styleUrls: ['./response-modal.component.css']
})
export class ResponseModalComponent implements OnInit {
  @ViewChild('iframe') iframe: ElementRef;
  @Input() public data;
  elementType: 'url' | 'canvas' | 'img' = 'url';
  constructor(
    public activeModal: NgbActiveModal,
    private clipboardService: ClipboardService,
    public sanitizer: DomSanitizer
  ) { }

  ngOnInit() {
    if (this.data.type === 'AliPayAccount' || this.data.type === 'BankCard') {
      this.data.bankAccount = this.data.accountId;
      this.data.bankAccountName = this.data.accountOwner;
    }

    if (this.data.type === 'FORM_DOC' || this.data.type === 'HTML') {
      setTimeout(() => {
        this.setIframeReady(this.iframe);
      }, 1000);
    }
    if (this.data.type === 'REDIRECT' && this.data.content.includes('https')) {
      setTimeout(() => {
        this.setIframeReady(this.iframe);
      }, 1000);
    } else {
      this.data.type === 'REDIRECTS';
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

  setIframeReady(iframe: ElementRef): void {
    const win: Window = iframe.nativeElement.contentWindow;
    const doc: Document = win.document;
    doc.open();
    doc.write(this.data.content);
    doc.close();
  }

}
