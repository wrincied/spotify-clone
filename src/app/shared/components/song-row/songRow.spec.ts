import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SongRow } from './songRow';

describe('SongRow', () => {
  let component: SongRow;
  let fixture: ComponentFixture<SongRow>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SongRow]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SongRow);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
