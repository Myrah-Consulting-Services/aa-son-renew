import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Inward } from './inward';

describe('Inward', () => {
  let component: Inward;
  let fixture: ComponentFixture<Inward>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Inward]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Inward);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
