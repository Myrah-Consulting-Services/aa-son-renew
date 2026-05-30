import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Benefit } from './benefit';

describe('Benefit', () => {
  let component: Benefit;
  let fixture: ComponentFixture<Benefit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Benefit]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Benefit);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
