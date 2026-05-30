import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportAttendance } from './import-attendance';

describe('ImportAttendance', () => {
  let component: ImportAttendance;
  let fixture: ComponentFixture<ImportAttendance>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportAttendance]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImportAttendance);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
