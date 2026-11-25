import { HttpCustomHeader } from '@shared/enums/http-custom-headers.enum';

/** Headers for file download responses. */
export function getDocumentHeaders(
  filename: string,
  mimeType: string,
  disposition: 'inline' | 'attachment' = 'attachment',
): Record<string, string> {
  return {
    'Content-Type': mimeType,
    'Content-Disposition': `${disposition}; filename="${filename}"`,
    'Access-Control-Expose-Headers': 'Content-Disposition',
  };
}

/** Headers carrying a backend warning tag (`httpRequest.warning.{tag}`). */
export function getWarningHeaders(warningTag: string): Record<string, string> {
  return {
    'Access-Control-Expose-Headers': HttpCustomHeader.CUSTOM_WARNING_MESSAGE,
    [HttpCustomHeader.CUSTOM_WARNING_MESSAGE]: warningTag,
    'Cache-Control': 'no-store',
  };
}
