import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ROUNDPLANTERS } from './roundplanters';

describe('ROUNDPLANTERS', () => {
  let component: ROUNDPLANTERS;
  let fixture: ComponentFixture<ROUNDPLANTERS>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ROUNDPLANTERS]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ROUNDPLANTERS);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
