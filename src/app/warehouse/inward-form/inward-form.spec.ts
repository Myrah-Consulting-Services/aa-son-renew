import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InwardForm } from './inward-form';

describe('InwardForm', () => {
  let component: InwardForm;
  let fixture: ComponentFixture<InwardForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InwardForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InwardForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
