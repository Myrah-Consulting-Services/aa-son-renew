import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CashDetail } from './cash-detail';

describe('CashDetail', () => {
  let component: CashDetail;
  let fixture: ComponentFixture<CashDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CashDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CashDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

