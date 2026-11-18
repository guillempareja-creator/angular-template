import { TestBed } from '@angular/core/testing';
import {
  type ActivatedRouteSnapshot,
  type CanActivateFn,
  type RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { signal } from '@angular/core';
import { AuthService } from '@core/services/auth.service';
import { authGuard, guestGuard } from './auth.guard';

describe('auth guards', () => {
  const isAuthenticated = signal(false);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: { isAuthenticated } }],
    });
  });

  function run(guard: CanActivateFn): ReturnType<CanActivateFn> {
    return TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
  }

  function urlOf(result: ReturnType<CanActivateFn>): string {
    expect(result).toBeInstanceOf(UrlTree);
    return (result as UrlTree).toString();
  }

  describe('authGuard', () => {
    it('lets authenticated users through', () => {
      isAuthenticated.set(true);

      expect(run(authGuard)).toBe(true);
    });

    it('redirects anonymous users to the login page', () => {
      isAuthenticated.set(false);

      expect(urlOf(run(authGuard))).toBe('/login');
    });
  });

  describe('guestGuard', () => {
    it('lets anonymous users through', () => {
      isAuthenticated.set(false);

      expect(run(guestGuard)).toBe(true);
    });

    it('redirects authenticated users to the main page', () => {
      isAuthenticated.set(true);

      expect(urlOf(run(guestGuard))).toBe('/main');
    });
  });
});
