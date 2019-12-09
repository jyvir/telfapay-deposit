import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {Utility} from '../../../shared/helpers/utility';
import {ClipboardService} from 'ngx-clipboard';
import {DomSanitizer} from '@angular/platform-browser';
import * as $ from 'jquery';
import {ToastrService} from 'ngx-toastr';
import {catchError} from 'rxjs/operators';
import {HttpErrorResponse} from '@angular/common/http';
import Swal from "sweetalert2";
import {throwError} from 'rxjs';
import {CommonService} from '../../../core/common/common.service';

@Component({
  selector: 'app-response-modal',
  templateUrl: './response-modal.component.html',
  styleUrls: ['./response-modal.component.css']
})
export class ResponseModalComponent implements OnInit {
  @ViewChild('iframe') iframe: ElementRef;
  @Input() public data;
  isLoading = false;
  elementType: 'url' | 'canvas' | 'img' = 'url';
  constructor(
    public activeModal: NgbActiveModal,
    private clipboardService: ClipboardService,
    public sanitizer: DomSanitizer,
    private toastr: ToastrService,
    private commonService: CommonService
  ) { }

  ngOnInit() {
    if (!this.data.hasMoreChannel) {
      this.initialize();
    }
  }

  initialize() {
    this.isLoading = false;
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
    } else if (this.data.type === 'REDIRECT') {
      this.data.type = 'REDIRECTS';
    }
  }
  copy(val) {
    this.clipboardService.copyFromContent(val);
    this.toastr.success('已复制');
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

  sendToAPI(channelSel) {
    this.isLoading = true;
    const payload = this.data.payload;
    for (const channel of this.data.channels) {
      if (channelSel === 'H5' && channel.includes('H5') ) {
        payload.channel = channel;
      } else if (channelSel === 'send' && !channel.includes('H5')) {
        payload.channel = channel;
      }
    }
    const req = Utility.generateSign(payload);
    this.commonService.sendPayment('', req).pipe(
      catchError((res: HttpErrorResponse) => {
        this.isLoading = false;
        let errorMsg = res.error && res.error.messages[0] ? res.error.messages[0] : 'Something went wrong';
        errorMsg = Utility.manualTranslateErrorMsg(errorMsg);
        Swal.fire({
          html: errorMsg,
          icon: 'error'
        });
        return throwError(JSON.stringify(res));
      })
    ).subscribe(resp => {
      this.data.hasMoreChannel = false;
      this.data = resp;
      this.initialize();
    });
  }

}
