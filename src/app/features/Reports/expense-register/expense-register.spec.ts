import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpenseRegister } from './expense-register';

describe('ExpenseRegister', () => {
  let component: ExpenseRegister;
  let fixture: ComponentFixture<ExpenseRegister>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpenseRegister]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExpenseRegister);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
