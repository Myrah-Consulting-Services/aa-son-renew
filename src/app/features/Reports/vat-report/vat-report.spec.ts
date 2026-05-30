import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VatReport } from './vat-report';

describe('VatReport', () => {
  let component: VatReport;
  let fixture: ComponentFixture<VatReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VatReport]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VatReport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
