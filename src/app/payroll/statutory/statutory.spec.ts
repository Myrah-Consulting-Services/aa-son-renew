import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Statutory } from './statutory';

describe('Statutory', () => {
  let component: Statutory;
  let fixture: ComponentFixture<Statutory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Statutory]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Statutory);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
