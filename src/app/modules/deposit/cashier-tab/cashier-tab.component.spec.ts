import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CashierTabComponent } from './cashier-tab.component';

describe('CashierTabComponent', () => {
  let component: CashierTabComponent;
  let fixture: ComponentFixture<CashierTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CashierTabComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CashierTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
