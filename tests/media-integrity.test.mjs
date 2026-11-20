import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {archivedFilenameForPost,isPublishedWeek} from "../lib/media/archive-path.mjs";

test("published media archiver passes Node syntax and has deterministic Instagram filenames",()=>{
  const check=spawnSync(process.execPath,["--check","scripts/archive-published-media.mjs"],{encoding:"utf8"});
  assert.equal(check.status,0,check.stderr);
  assert.equal(archivedFilenameForPost({
    platform:"Instagram",url:"https://www.instagram.com/reel/Df3UbiPBzO8/?igsh=abc"
  }),"ig-Df3UbiPBzO8.jpg");
  assert.equal(archivedFilenameForPost({
    platform:"Instagram",url:"https://www.instagram.com/p/Df56bphCVA0/"
  }),"ig-Df56bphCVA0.jpg");
  assert.equal(archivedFilenameForPost({
    platform:"Instagram",url:"https://www.instagram.com/stories/opusplasticsurgery/4033289804016279060"
  }),"story-4033289804016279060.jpg");
  const fb={platform:"Facebook",url:"https://www.facebook.com/reel/123"};
  assert.equal(archivedFilenameForPost(fb),archivedFilenameForPost(fb));
  assert.match(archivedFilenameForPost(fb),/^social-[a-f0-9]{18}\.jpg$/);
});
test("the archivist accepts real Monday dates, not literal backslash-d text",()=>{
  assert.equal(isPublishedWeek("2026-11-16"),true);
  assert.equal(isPublishedWeek("2026-11-09"),true);
  for(const x of ["2026-11-20","2026-02-30","\\d{4}-\\d{2}-\\d{2}","x","2026-11-1"]){
    assert.equal(isPublishedWeek(x),false,x);
  }
});
test("frontend never fabricates missing /media/p- or /media/s- routes",()=>{
  const src=readFileSync(new URL("../app/media-views.tsx",import.meta.url),"utf8");
  assert.doesNotMatch(src,/return code\?"\/media\/p-/);
  assert.doesNotMatch(src,/return id\?"\/media\/s-/);
  assert.match(src,/savedImagePaths\.has/);
  assert.match(src,/onError=\{\(\)=>setStep/);
});
test("selected-week Story totals and freshness are sourced from selected snapshot",()=>{
  const src=readFileSync(new URL("../app/dashboard.tsx",import.meta.url),"utf8");
  assert.match(src,/selectedSnapshot\?\.story_replies\?\?storySum\("replies"\)/);
  assert.match(src,/selectedSnapshot\?\.story_impressions\?\?storySum\("impressions"\)/);
  assert.match(src,/periodStories\.every\(story=>story\[field\]!=null\)/);
  assert.match(src,/temporaryStoryPreviews/);
  assert.doesNotMatch(src,/Updated \{formatCaptureDate\(snapshot\.captured_at\)\}/);
});
test("new media archive may be dispatched by source changes, no raw CRM access",()=>{
  const wf=readFileSync(new URL("../.github/workflows/archive-published-media.yml",import.meta.url),"utf8");
  const script=readFileSync(new URL("../scripts/archive-published-media.mjs",import.meta.url),"utf8");
  assert.match(wf,/scripts\/archive-published-media\.mjs/);
  assert.match(script,/\/api\/publications/);
  assert.doesNotMatch(script,/signal_private|service_role|patient_email|patient_name/);
});
