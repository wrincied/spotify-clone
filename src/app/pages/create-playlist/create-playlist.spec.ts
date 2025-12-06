import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatePlaylist } from './create-playlist';

describe('CreatePlaylist', () => {
  let component: CreatePlaylist;
  let fixture: ComponentFixture<CreatePlaylist>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatePlaylist]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreatePlaylist);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
