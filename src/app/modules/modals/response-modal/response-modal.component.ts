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

  }

  copy(val) {
    this.clipboardService.copyFromContent(val);
  }

}
