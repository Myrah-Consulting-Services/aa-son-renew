import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentOut } from './payment-out';

describe('PaymentOut', () => {
  let component: PaymentOut;
  let fixture: ComponentFixture<PaymentOut>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentOut]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentOut);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
