import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateCash } from './create-cash';

describe('CreateCash', () => {
  let component: CreateCash;
  let fixture: ComponentFixture<CreateCash>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateCash]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateCash);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
