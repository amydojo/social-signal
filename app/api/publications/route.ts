import {loadPublishedWeeks} from "../../../lib/signal/read-public";

/** Public *published-only* feed for auditing and media archival.
 * Private source tables and original vendor exports are never exposed.
 */
export const dynamic="force-dynamic";
export async function GET(){
  const weeks=await loadPublishedWeeks();
  return Response.json({schemaVersion:1,weeks},{
    headers:{
      "Cache-Control":"public, s-maxage=120, stale-while-revalidate=180",
      "X-Content-Type-Options":"nosniff"
    }
  });
}
