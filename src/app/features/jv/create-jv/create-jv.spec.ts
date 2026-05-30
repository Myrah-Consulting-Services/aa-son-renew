import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateJv } from './create-jv';

describe('CreateJv', () => {
  let component: CreateJv;
  let fixture: ComponentFixture<CreateJv>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateJv]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateJv);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
