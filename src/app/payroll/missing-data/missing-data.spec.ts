import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MissingData } from './missing-data';

describe('MissingData', () => {
  let component: MissingData;
  let fixture: ComponentFixture<MissingData>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MissingData]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MissingData);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
