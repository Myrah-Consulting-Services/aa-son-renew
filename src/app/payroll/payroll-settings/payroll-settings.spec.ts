import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PayrollSettings } from './payroll-settings';

describe('PayrollSettings', () => {
  let component: PayrollSettings;
  let fixture: ComponentFixture<PayrollSettings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PayrollSettings]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PayrollSettings);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
