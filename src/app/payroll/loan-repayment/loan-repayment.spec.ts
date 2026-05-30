import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoanRepayment } from './loan-repayment';

describe('LoanRepayment', () => {
  let component: LoanRepayment;
  let fixture: ComponentFixture<LoanRepayment>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoanRepayment]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoanRepayment);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
