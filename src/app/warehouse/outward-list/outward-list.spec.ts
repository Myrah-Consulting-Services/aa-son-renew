import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OutwardList } from './outward-list';

describe('OutwardList', () => {
  let component: OutwardList;
  let fixture: ComponentFixture<OutwardList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OutwardList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OutwardList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
