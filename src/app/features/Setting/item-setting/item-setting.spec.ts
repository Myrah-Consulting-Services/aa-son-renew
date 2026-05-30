import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemSetting } from './item-setting';

describe('ItemSetting', () => {
  let component: ItemSetting;
  let fixture: ComponentFixture<ItemSetting>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemSetting]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItemSetting);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
