import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopNav } from './top-nav';

describe('TopNav', () => {
  let component: TopNav;
  let fixture: ComponentFixture<TopNav>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopNav]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TopNav);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
