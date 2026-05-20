import { redirect } from 'next/navigation';

/**
 * Alias for /upload — the legacy conversion-history page links here.
 * Avoids a 404 while we standardise on the new /upload route.
 */
export default function ConvertRedirect() {
  redirect('/upload');
}
