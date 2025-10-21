import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { InTransitComponent } from './in-transit.component';

describe('InTransitComponent', () => {
  let component: InTransitComponent;
  let fixture: ComponentFixture<InTransitComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [InTransitComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InTransitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
