import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpotifySidebar } from './spotify-sidebar';

describe('SpotifySidebar', () => {
  let component: SpotifySidebar;
  let fixture: ComponentFixture<SpotifySidebar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpotifySidebar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpotifySidebar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
