import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DamageList } from './damage-list';

describe('DamageList', () => {
  let component: DamageList;
  let fixture: ComponentFixture<DamageList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DamageList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DamageList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
