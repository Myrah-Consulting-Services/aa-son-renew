import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Career } from './career';

describe('Career', () => {
  let component: Career;
  let fixture: ComponentFixture<Career>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Career]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Career);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
