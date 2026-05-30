import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LedgerList } from './ledger-list';

describe('LedgerList', () => {
  let component: LedgerList;
  let fixture: ComponentFixture<LedgerList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LedgerList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LedgerList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
