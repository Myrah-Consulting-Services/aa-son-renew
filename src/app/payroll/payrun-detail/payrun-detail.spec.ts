import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PayrunDetail } from './payrun-detail';

describe('PayrunDetail', () => {
  let component: PayrunDetail;
  let fixture: ComponentFixture<PayrunDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PayrunDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PayrunDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
