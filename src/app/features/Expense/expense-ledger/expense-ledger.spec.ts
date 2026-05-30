import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpenseLedger } from './expense-ledger';

describe('ExpenseLedger', () => {
  let component: ExpenseLedger;
  let fixture: ComponentFixture<ExpenseLedger>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpenseLedger]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExpenseLedger);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
