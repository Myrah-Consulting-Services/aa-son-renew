import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentRegister } from './payment-register';

describe('PaymentRegister', () => {
  let component: PaymentRegister;
  let fixture: ComponentFixture<PaymentRegister>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentRegister]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentRegister);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
