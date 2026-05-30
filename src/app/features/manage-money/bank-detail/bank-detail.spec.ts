import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BankDetail } from './bank-detail';

describe('BankDetail', () => {
  let component: BankDetail;
  let fixture: ComponentFixture<BankDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BankDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BankDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

