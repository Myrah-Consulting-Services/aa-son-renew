import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RelocationForm } from './relocation-form';

describe('RelocationForm', () => {
  let component: RelocationForm;
  let fixture: ComponentFixture<RelocationForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RelocationForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RelocationForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
