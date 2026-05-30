import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CerateLedger } from './cerate-ledger';

describe('CerateLedger', () => {
  let component: CerateLedger;
  let fixture: ComponentFixture<CerateLedger>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CerateLedger]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CerateLedger);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
