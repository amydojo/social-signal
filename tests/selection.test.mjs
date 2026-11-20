import test from "node:test";
import assert from "node:assert/strict";
import {weekStartFor,groupPostsByWeek,chooseWeeklyFeatures,interactionCount,labelWeek} from "../app/frew/frew-selection.ts";

const post=(id,date,format,views,likes,shares=0,platform="Instagram")=>({
  id,date,format,platform,account:"@opusplasticsurgery",title:id,url:"https://www.instagram.com/p/"+id+"/",
  views,likes,comments:0,shares,saves:0,status:null,ctaChecked:null,complianceChecked:null
});

test("Monday–Sunday period rolls correctly at Sunday, Monday and new year",()=>{
  assert.equal(weekStartFor("2026-11-22"),"2026-11-16");
  assert.equal(weekStartFor("2026-11-23"),"2026-11-23");
  assert.equal(weekStartFor("2027-01-01"),"2026-12-28");
  assert.equal(weekStartFor("not-a-date"),null);
  assert.equal(weekStartFor("2026-02-30"),null);
  assert.equal(labelWeek("2026-11-16"),"Nov 16–Nov 22");
});

test("new posts and stories are scoped to source publication week",()=>{
  const items=[post("a","2026-11-22","Reel",30,2),post("b","2026-11-23","Carousel",50,8),
    post("c","2026-11-16","Story",9,0)];
  const groups=groupPostsByWeek(items);
  assert.deepEqual(Object.keys(groups).sort(),["2026-11-16","2026-11-23"]);
  assert.equal(groups["2026-11-16"].length,2);
  assert.equal(groups["2026-11-23"][0].format,"Carousel");
});

test("features select actual creatives, including carousels, without fixed post IDs",()=>{
  const posts=[post("reel","2026-11-19","Reel",1500,30),
    post("carousel","2026-11-20","Carousel",900,90),
    post("other","2026-11-20","Reel",1000,10),
    post("story","2026-11-20","Story",20000,3),
    post("tiktok","2026-11-20","Video",8000,80,"TikTok")];
  const f=chooseWeeklyFeatures(posts);
  assert.equal(f[0].post.id,"reel");
  assert.equal(f[1].post.id,"carousel");
  assert.equal(f[1].label,"STRONG ENGAGEMENT");
});

test("missing metrics remain missing instead of fabricated zero",()=>{
  const p=post("unknown","2026-11-20","Carousel",400,3);
  p.saves=null;
  assert.equal(interactionCount(p),null);
  const f=chooseWeeklyFeatures([post("strong","2026-11-19","Reel",800,20),p]);
  assert.equal(f[1].label,"NEXT MOST VIEWED");
});

test("equal view counts break ties deterministically",()=>{
  const f=chooseWeeklyFeatures([post("z","2026-11-19","Reel",50,0),
    post("a","2026-11-19","Carousel",50,0)]);
  assert.equal(f[0].post.id,"a");
});
