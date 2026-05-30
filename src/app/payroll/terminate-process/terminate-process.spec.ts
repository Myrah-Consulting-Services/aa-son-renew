import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TerminateProcess } from './terminate-process';

describe('TerminateProcess', () => {
  let component: TerminateProcess;
  let fixture: ComponentFixture<TerminateProcess>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TerminateProcess]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TerminateProcess);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
