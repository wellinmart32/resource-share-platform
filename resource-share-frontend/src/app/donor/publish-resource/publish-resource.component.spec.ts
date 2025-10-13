import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PublishResourceComponent } from './publish-resource.component';

describe('PublishResourceComponent', () => {
  let component: PublishResourceComponent;
  let fixture: ComponentFixture<PublishResourceComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [PublishResourceComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PublishResourceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
