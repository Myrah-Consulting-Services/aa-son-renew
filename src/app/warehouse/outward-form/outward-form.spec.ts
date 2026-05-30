import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OutwardForm } from './outward-form';

describe('OutwardForm', () => {
  let component: OutwardForm;
  let fixture: ComponentFixture<OutwardForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OutwardForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OutwardForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
