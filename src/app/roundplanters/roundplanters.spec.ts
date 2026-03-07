import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoundPlanters } from './roundplanters';

describe('RoundPlanters', () => {
  let component: RoundPlanters;
  let fixture: ComponentFixture<RoundPlanters>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoundPlanters]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoundPlanters);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
