import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OverallInsight } from './overall-insight';

describe('OverallInsight', () => {
  let component: OverallInsight;
  let fixture: ComponentFixture<OverallInsight>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OverallInsight]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OverallInsight);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
