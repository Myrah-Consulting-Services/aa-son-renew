import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RelocationList } from './relocation-list';

describe('RelocationList', () => {
  let component: RelocationList;
  let fixture: ComponentFixture<RelocationList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RelocationList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RelocationList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
