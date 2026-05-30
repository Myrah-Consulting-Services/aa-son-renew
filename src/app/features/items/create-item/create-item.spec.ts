import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateItem } from './create-item';

describe('CreateItem', () => {
  let component: CreateItem;
  let fixture: ComponentFixture<CreateItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateItem]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateItem);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
