import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogReports } from './log-reports';

describe('LogReports', () => {
  let component: LogReports;
  let fixture: ComponentFixture<LogReports>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogReports]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LogReports);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
