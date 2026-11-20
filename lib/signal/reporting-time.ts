/** Stable source and display timezone for the OPUS reporting calendar.
 * Server-side rendering and browser hydration must format identical dates.
 */
export const REPORT_TIMEZONE="America/Los_Angeles";
export function formatCaptureDate(iso:string):string{
  const captured=new Date(iso);
  if(Number.isNaN(captured.getTime()))return "Capture date unavailable";
  return captured.toLocaleDateString("en-US",{
    month:"short",day:"numeric",year:"numeric",timeZone:REPORT_TIMEZONE
  });
}
