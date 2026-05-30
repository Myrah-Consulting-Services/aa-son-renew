import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LedgerReport } from './ledger-report';

describe('LedgerReport', () => {
  let component: LedgerReport;
  let fixture: ComponentFixture<LedgerReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LedgerReport]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LedgerReport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
