import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CashWithdraw } from './cash-withdraw';

describe('CashWithdraw', () => {
  let component: CashWithdraw;
  let fixture: ComponentFixture<CashWithdraw>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CashWithdraw]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CashWithdraw);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
