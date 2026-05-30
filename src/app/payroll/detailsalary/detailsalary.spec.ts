import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Detailsalary } from './detailsalary';

describe('Detailsalary', () => {
  let component: Detailsalary;
  let fixture: ComponentFixture<Detailsalary>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Detailsalary]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Detailsalary);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
