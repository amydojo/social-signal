/** Merge overlapping provider snapshots of the same published post.
 * Keep the last observation supplied for a post, which should be the newer
 * source record. Never combine view or interaction totals from duplicates.
 * Instagram and Facebook shares are separate publications.
 */
export function uniquePostsByIdentity<T extends {id:string;platform:string;permalink:string|null|undefined}>(posts:T[]):T[]{
  const mapped=new Map<string,T>();
  for(const post of posts){
    const canonical=(post.permalink??"").trim().split(/[?#]/)[0].replace(/\/+$/,"");
    const key=post.platform.toLowerCase()+"|"+(canonical||post.id);
    mapped.set(key,post);
  }
  return [...mapped.values()];
}
