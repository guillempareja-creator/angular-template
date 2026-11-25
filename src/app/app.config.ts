import {
  type ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { provideI18n } from '@core/i18n/i18n.providers';
import { loaderInterceptor } from '@core/interceptors/loader.interceptor';
import { notificationInterceptor } from '@core/interceptors/notification.interceptor';
import { authInterceptor } from '@core/interceptors/auth.interceptor';
import { apiUrlInterceptor } from '@core/interceptors/api-url.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    ),
    provideHttpClient(
      // Order matters: outer → inner. apiUrlInterceptor must stay last so the
      // others see the relative URL.
      withInterceptors([
        loaderInterceptor,
        notificationInterceptor,
        authInterceptor,
        apiUrlInterceptor,
      ]),
    ),
    provideI18n(),
  ],
};
