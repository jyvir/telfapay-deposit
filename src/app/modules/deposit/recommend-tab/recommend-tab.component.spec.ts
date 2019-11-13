import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RecommendTabComponent } from './recommend-tab.component';

describe('RecommendTabComponent', () => {
  let component: RecommendTabComponent;
  let fixture: ComponentFixture<RecommendTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RecommendTabComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RecommendTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
