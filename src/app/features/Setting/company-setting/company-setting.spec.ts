import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompanySetting } from './company-setting';

describe('CompanySetting', () => {
  let component: CompanySetting;
  let fixture: ComponentFixture<CompanySetting>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompanySetting]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompanySetting);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
