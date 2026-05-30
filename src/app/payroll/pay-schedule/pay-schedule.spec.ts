import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaySchedule } from './pay-schedule';

describe('PaySchedule', () => {
  let component: PaySchedule;
  let fixture: ComponentFixture<PaySchedule>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaySchedule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaySchedule);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
