import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateExpense } from './create-expense';

describe('CreateExpense', () => {
  let component: CreateExpense;
  let fixture: ComponentFixture<CreateExpense>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateExpense]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateExpense);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
