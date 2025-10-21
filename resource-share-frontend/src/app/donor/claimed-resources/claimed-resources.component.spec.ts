import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ClaimedResourcesComponent } from './claimed-resources.component';

describe('ClaimedResourcesComponent', () => {
  let component: ClaimedResourcesComponent;
  let fixture: ComponentFixture<ClaimedResourcesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ClaimedResourcesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ClaimedResourcesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
