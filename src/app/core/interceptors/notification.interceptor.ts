import {
  HttpErrorResponse,
  type HttpInterceptorFn,
  type HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs';
import { HttpResponseHandlerService } from '@core/services/http-response-handler.service';
import { HttpCustomHeader } from '@shared/enums/http-custom-headers.enum';
import { SUCCESS_MESSAGE } from './http-context.tokens';
import { isApiRequest } from './interceptor.utils';

function notifyResponse(
  req: HttpRequest<unknown>,
  res: HttpResponse<unknown>,
  responseHandler: HttpResponseHandlerService,
): void {
  const warningTag = res.headers.get(HttpCustomHeader.CUSTOM_WARNING_MESSAGE);
  if (warningTag) {
    responseHandler.handleHttpWarning(warningTag);
    return;
  }

  const successTag = req.context.get(SUCCESS_MESSAGE);
  if (successTag) {
    responseHandler.handleSuccessResponse(successTag);
  }
}

/**
 * Shows toasts for API responses: backend warnings (response header),
 * success messages (`SUCCESS_MESSAGE` context) and HTTP errors.
 */
export const notificationInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiRequest(req)) {
    return next(req);
  }

  const responseHandler = inject(HttpResponseHandlerService);

  return next(req).pipe(
    tap({
      next: (event) => {
        if (event instanceof HttpResponse) {
          notifyResponse(req, event, responseHandler);
        }
      },
      error: (error: unknown) => {
        if (error instanceof HttpErrorResponse) {
          responseHandler.handleHttpError(error);
        }
      },
    }),
  );
};
