import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BenefitDetail } from './benefit-detail';

describe('BenefitDetail', () => {
  let component: BenefitDetail;
  let fixture: ComponentFixture<BenefitDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BenefitDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BenefitDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
