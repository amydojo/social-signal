import test from "node:test";
import assert from "node:assert/strict";
import {parsePublishedReport} from "../lib/signal/publication.ts";

const original=()=>({
  week_start:"2026-11-16",week_end:"2026-11-22",status:"in_progress",
  captured_at:"2026-11-19T20:00:00Z",data_through:"2026-11-18",
  schema_version:1,revision:1,
  payload:{
    posts:[{id:"carousel-1",date:"2026-11-19",platform:"Instagram",
      account:"@opusplasticsurgery",format:"Carousel",title:"Patient question",
      url:"https://www.instagram.com/p/example/",views:300,
      likes:12,comments:0,shares:2,saves:1,
      thumbnailPath:"/media/archive/ig-example.jpg"}],
    channels:[{platform:"Google Ads",account:"OPUS",period:"Nov 16–18",
      metrics:[{label:"Conversions",value:5},{label:"Directions",value:null}]}],
    overview:{statement:"Search conversions rose",summary:"Five platform actions, not bookings",
      action:"Verify bookings in CRM",indicators:[{label:"Conversions",value:5,detail:"Google Ads"}]}
  }
});
test("accepts a reviewed, in-week public report with null measurements",()=>{
  const v=parsePublishedReport(original());
  assert.ok(v);
  assert.equal(v.weekStart,"2026-11-16");
  assert.equal(v.posts[0].format,"Carousel");
  assert.equal(v.channels[0].metrics[1].value,null);
  assert.equal(v.overview.indicators[0].value,5);
  assert.equal(v.posts[0].thumbnailPath,"/media/archive/ig-example.jpg");
});
test("rejects cross-week posts instead of silently blending periods",()=>{
  const p=original();p.payload.posts[0].date="2026-11-23";
  assert.equal(parsePublishedReport(p),null);
});
test("rejects malformed date, stale schema and bad reporting period",()=>{
  const p=original();p.week_start="2026-11-17";
  assert.equal(parsePublishedReport(p),null);
  const q=original();q.schema_version=2;
  assert.equal(parsePublishedReport(q),null);
  const y=original();y.data_through="2026-11-23";
  assert.equal(parsePublishedReport(y),null);
});
test("rejects private raw payload fields and unsafe image/redirects",()=>{
  const p=original();p.payload.posts[0].patient_email="test@example.com";
  assert.equal(parsePublishedReport(p),null);
  const q=original();q.payload.posts[0].coverUrl="javascript:alert(1)";
  assert.equal(parsePublishedReport(q),null);
  const r=original();r.payload.posts[0].thumbnailPath="/admin/secret.jpg";
  assert.equal(parsePublishedReport(r),null);
});
test("detects duplicate records and unsupported metric values",()=>{
  const p=original();p.payload.posts.push({...p.payload.posts[0]});
  assert.equal(parsePublishedReport(p),null);
  const n=original();n.payload.channels[0].metrics[0].value=-5;
  assert.equal(parsePublishedReport(n),null);
});


test("preserves source-reported interactions when saves/shares are unreported",()=>{
  const p=original();
  p.payload.posts[0].shares=null;
  p.payload.posts[0].interactions=18;
  p.payload.posts[0].impressions=3;
  const parsed=parsePublishedReport(p);
  assert.ok(parsed);
  assert.equal(parsed.posts[0].interactions,18);
  assert.equal(parsed.posts[0].impressions,3);
  const bad=original();
  bad.payload.posts[0].impressions=-2;
  assert.equal(parsePublishedReport(bad),null);
});
