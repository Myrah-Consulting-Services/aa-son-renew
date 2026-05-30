import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvTemplate } from './inv-template';

describe('InvTemplate', () => {
  let component: InvTemplate;
  let fixture: ComponentFixture<InvTemplate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvTemplate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvTemplate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
