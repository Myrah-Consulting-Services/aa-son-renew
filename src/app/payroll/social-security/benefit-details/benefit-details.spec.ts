import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BenefitDetails } from './benefit-details';

describe('BenefitDetails', () => {
  let component: BenefitDetails;
  let fixture: ComponentFixture<BenefitDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BenefitDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BenefitDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
