import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { BrowseResourcesComponent } from './browse-resources.component';

describe('BrowseResourcesComponent', () => {
  let component: BrowseResourcesComponent;
  let fixture: ComponentFixture<BrowseResourcesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [BrowseResourcesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BrowseResourcesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
