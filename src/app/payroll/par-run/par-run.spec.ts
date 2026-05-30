import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParRun } from './par-run';

describe('ParRun', () => {
  let component: ParRun;
  let fixture: ComponentFixture<ParRun>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParRun]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParRun);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
