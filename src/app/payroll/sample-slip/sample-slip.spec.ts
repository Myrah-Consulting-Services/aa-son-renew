import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SampleSlip } from './sample-slip';

describe('SampleSlip', () => {
  let component: SampleSlip;
  let fixture: ComponentFixture<SampleSlip>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SampleSlip]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SampleSlip);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
