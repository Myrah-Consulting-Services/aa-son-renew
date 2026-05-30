import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BankToBank } from './bank-to-bank';

describe('BankToBank', () => {
  let component: BankToBank;
  let fixture: ComponentFixture<BankToBank>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BankToBank]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BankToBank);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
