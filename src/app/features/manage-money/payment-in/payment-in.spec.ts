import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentIn } from './payment-in';

describe('PaymentIn', () => {
  let component: PaymentIn;
  let fixture: ComponentFixture<PaymentIn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentIn]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentIn);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
