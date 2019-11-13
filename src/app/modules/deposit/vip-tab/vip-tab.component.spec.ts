import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VipTabComponent } from './vip-tab.component';

describe('VipTabComponent', () => {
  let component: VipTabComponent;
  let fixture: ComponentFixture<VipTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VipTabComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VipTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
