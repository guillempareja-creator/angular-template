import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideTranslateService()],
    });
  });

  it('renders the layout: header, routed content and footer', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('header app-header')).not.toBeNull();
    expect(host.querySelector('main router-outlet')).not.toBeNull();
    expect(host.querySelector('footer app-footer')).not.toBeNull();
  });
});
