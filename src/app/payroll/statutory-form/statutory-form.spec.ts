import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatutoryForm } from './statutory-form';

describe('StatutoryForm', () => {
  let component: StatutoryForm;
  let fixture: ComponentFixture<StatutoryForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatutoryForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StatutoryForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
