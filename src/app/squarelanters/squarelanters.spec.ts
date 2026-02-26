import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SQUARELANTERS } from './squarelanters';

describe('SQUARELANTERS', () => {
  let component: SQUARELANTERS;
  let fixture: ComponentFixture<SQUARELANTERS>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SQUARELANTERS]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SQUARELANTERS);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
