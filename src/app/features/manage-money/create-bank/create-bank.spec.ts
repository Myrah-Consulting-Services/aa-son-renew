import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateBank } from './create-bank';

describe('CreateBank', () => {
  let component: CreateBank;
  let fixture: ComponentFixture<CreateBank>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateBank]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateBank);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
