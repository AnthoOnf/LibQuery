import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchmapComponent } from './searchmap.component';

describe('SearchmapComponent', () => {
  let component: SearchmapComponent;
  let fixture: ComponentFixture<SearchmapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SearchmapComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchmapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
