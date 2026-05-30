import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VatReturn } from './vat-return';

describe('VatReturn', () => {
  let component: VatReturn;
  let fixture: ComponentFixture<VatReturn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VatReturn]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VatReturn);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
