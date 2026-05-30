import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReviseSalary } from './revise-salary';

describe('ReviseSalary', () => {
  let component: ReviseSalary;
  let fixture: ComponentFixture<ReviseSalary>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviseSalary]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReviseSalary);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
