import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BenefitCreation } from './benefit-creation';

describe('BenefitCreation', () => {
  let component: BenefitCreation;
  let fixture: ComponentFixture<BenefitCreation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BenefitCreation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BenefitCreation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
