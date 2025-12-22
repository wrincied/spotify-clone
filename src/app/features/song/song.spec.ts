import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Song } from './song';

describe('Song', () => {
  let component: Song;
  let fixture: ComponentFixture<Song>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Song]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Song);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
