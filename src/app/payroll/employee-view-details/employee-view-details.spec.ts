import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeViewDetails } from './employee-view-details';

describe('EmployeeViewDetails', () => {
  let component: EmployeeViewDetails;
  let fixture: ComponentFixture<EmployeeViewDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeViewDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeViewDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
