import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CashDeposit } from './cash-deposit';

describe('CashDeposit', () => {
  let component: CashDeposit;
  let fixture: ComponentFixture<CashDeposit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CashDeposit]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CashDeposit);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
