import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PartySetting } from './party-setting';

describe('PartySetting', () => {
  let component: PartySetting;
  let fixture: ComponentFixture<PartySetting>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartySetting]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PartySetting);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
