import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocationPay } from './location-pay';

describe('LocationPay', () => {
  let component: LocationPay;
  let fixture: ComponentFixture<LocationPay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocationPay]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LocationPay);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
