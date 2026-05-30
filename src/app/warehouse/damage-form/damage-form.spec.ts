import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DamageForm } from './damage-form';

describe('DamageForm', () => {
  let component: DamageForm;
  let fixture: ComponentFixture<DamageForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DamageForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DamageForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
