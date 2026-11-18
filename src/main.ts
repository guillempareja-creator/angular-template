import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { enableMocking } from './fake-backend/enable-mocking';

async function initializeApp(): Promise<void> {
  // MSW must intercept before the first request is fired
  await enableMocking();
  await bootstrapApplication(AppComponent, appConfig);
}

initializeApp().catch((error: unknown) => {
  console.error(error);
});
