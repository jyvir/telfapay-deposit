import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DepositRecordTabComponent } from './deposit-record-tab.component';

describe('DepositRecordTabComponent', () => {
  let component: DepositRecordTabComponent;
  let fixture: ComponentFixture<DepositRecordTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DepositRecordTabComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DepositRecordTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
