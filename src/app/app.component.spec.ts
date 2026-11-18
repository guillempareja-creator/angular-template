import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { LoaderService } from '@core/services/loader.service';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideTranslateService()],
    });
  });

  it('renders the layout with the notifications region', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('app-header')).not.toBeNull();
    expect(host.querySelector('router-outlet')).not.toBeNull();
    expect(host.querySelector('app-footer')).not.toBeNull();
    expect(host.querySelector('app-notifications')).not.toBeNull();
  });

  it('shows the global loader only while loading', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const loader = TestBed.inject(LoaderService);
    const host = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();

    expect(host.querySelector('app-global-loader')).toBeNull();

    loader.show();
    await fixture.whenStable();
    expect(host.querySelector('app-global-loader')).not.toBeNull();

    loader.hide();
    await fixture.whenStable();
    expect(host.querySelector('app-global-loader')).toBeNull();
  });
});
