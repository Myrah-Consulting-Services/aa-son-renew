import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalaryHistory } from './salary-history';

describe('SalaryHistory', () => {
  let component: SalaryHistory;
  let fixture: ComponentFixture<SalaryHistory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalaryHistory]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SalaryHistory);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
