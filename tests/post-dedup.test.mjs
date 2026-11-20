import test from "node:test";
import assert from "node:assert/strict";
import {uniquePostsByIdentity} from "../app/post-dedup.ts";

const p=(id,platform,permalink,views)=>({id,platform,permalink,views});
test("a repeated Instagram permalink is one post, with latest observation retained",()=>{
  const x=uniquePostsByIdentity([
    p("old","instagram","https://www.instagram.com/reel/ABC123/",611),
    p("other","instagram","https://www.instagram.com/p/DEF567/",500),
    p("fresh","Instagram","https://www.instagram.com/reel/ABC123/?utm_source=foo",669),
  ]);
  assert.equal(x.length,2);
  assert.equal(x.find(z=>z.id==="fresh")?.views,669);
  assert.equal(x.some(z=>z.id==="old"),false);
});
test("cross-posted Facebook creative is counted separately",()=>{
  const x=uniquePostsByIdentity([
    p("instagram","instagram","https://www.instagram.com/reel/ABC123/",100),
    p("facebook","facebook","https://www.facebook.com/reel/123/",80),
  ]);
  assert.equal(x.length,2);
});
test("missing permalinks use IDs instead of collapsing different posts",()=>{
  const x=uniquePostsByIdentity([p("a","instagram",null,3),p("b","instagram",null,4)]);
  assert.equal(x.length,2);
});
