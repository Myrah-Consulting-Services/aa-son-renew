import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeductionDetail } from './deduction-detail';

describe('DeductionDetail', () => {
  let component: DeductionDetail;
  let fixture: ComponentFixture<DeductionDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeductionDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeductionDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
