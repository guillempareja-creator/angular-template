import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { NgStringPipesModule } from 'ngx-pipes';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-header',
  imports: [NgStringPipesModule, TranslatePipe],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  // Injections
  private authService = inject(AuthService);

  // Data
  public session = this.authService.session;

  // Methods
  public handleLogout(): void {
    this.authService.logout();
  }
}
