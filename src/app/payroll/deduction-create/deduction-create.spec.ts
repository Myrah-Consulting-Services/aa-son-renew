import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeductionCreate } from './deduction-create';

describe('DeductionCreate', () => {
  let component: DeductionCreate;
  let fixture: ComponentFixture<DeductionCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeductionCreate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeductionCreate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
