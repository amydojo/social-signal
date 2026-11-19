import type { Snapshot, Post, Insight, Experiment, Story, Coverage, DailySocial, AdsDay } from "./dashboard";

// Public, read-only release assembled from the uploaded Metricool workbook.
// Data source: OPUS_Metricool_Performance_2026-11-09_to_11-15(1).xlsx
// Source retrieved/compiled November 16, 2026. No CRM / patient / API data.

export const snapshot: Snapshot = {
  id: "opus-2026-11-09-15",
  week_start: "2026-11-09",
  week_end: "2026-11-15",
  captured_at: "2026-11-19",
  source: "OPUS analytics · November 19 capture; Nov 9–15 snapshot",
  reel_views: 2014,
  reel_interactions: 48,
  feed_views: 2951,
  feed_interactions: 55,
  feed_pieces: 3,
  story_count: 12,
  story_impressions: 3254,
  story_replies: 6,
  account_data_through: "2026-11-13",
  coverage_notes: "Instagram post metrics refreshed Nov 19. TikTok Nov 13 video verified at 829 views / 62 interactions. GBP Nov 9–15: 15 Search views, 13 Maps views, 11 website clicks, 2 call clicks, 15 direction clicks across available daily observations; some days missing. Google Ads Nov 10–15 incomplete: 1,428 impressions, 66 clicks, two reported conversions, $87.41. Linked YouTube channel Amy Do is not the OPUS account. Other OPUS profiles not connected. Instagram account-wide views/reach incomplete."
};

export const posts: Post[] = [
  {id:"ig-reel-implants-fit",published_on:"2026-11-17",title:"How do breast implants fit?",permalink:"https://www.instagram.com/reel/Df0yAMmsZ2p/",platform:"instagram",format:"Reel",views:1039,reach:737,likes:28,comments:0,shares:4,saves:1,interactions:33,skip_3s_pct:40.2,avg_watch_seconds:8.968,raw_timestamp:"20261117"},

  {id:"ig-reel-keep",published_on:"2026-11-10",title:"What you want to keep",permalink:"https://www.instagram.com/reel/Dfiwcicsux9/",platform:"instagram",format:"Reel",views:555,reach:362,likes:25,comments:0,shares:1,saves:0,interactions:26,skip_3s_pct:46.8,avg_watch_seconds:8.069,raw_timestamp:"20261110014504"},
  {id:"ig-reel-scar",published_on:"2026-11-13",title:"What a scar can't show",permalink:"https://www.instagram.com/reel/DfqeQMZMKqR/",platform:"instagram",format:"Reel",views:1459,reach:1134,likes:18,comments:0,shares:3,saves:1,interactions:22,skip_3s_pct:36.7,avg_watch_seconds:8.567,raw_timestamp:"20261113014004"},
  {id:"ig-carousel-bulge",published_on:"2026-11-14",title:"Why is my belly still bulging?",permalink:"https://www.instagram.com/p/DftDagtkR6i/",platform:"instagram",format:"Carousel",views:937,reach:368,likes:6,comments:0,shares:1,saves:0,interactions:7,skip_3s_pct:null,avg_watch_seconds:null,raw_timestamp:"20261114014334"},
  {id:"fb-reel-scar",published_on:"2026-11-13",title:"What a scar can't show",permalink:"https://www.facebook.com/reel/997338790110767/",platform:"facebook",format:"Reel",views:17,reach:0,likes:0,comments:0,shares:0,saves:null,interactions:0,skip_3s_pct:null,avg_watch_seconds:null,raw_timestamp:"20261113014010"},
  {id:"fb-carousel-bulge",published_on:"2026-11-14",title:"Why is my belly still bulging?",permalink:"https://facebook.com/122123175627459507/posts/122124459129459507",platform:"facebook",format:"Carousel",views:null,impressions:1,reach:1,likes:0,comments:0,shares:0,saves:null,interactions:0,skip_3s_pct:null,avg_watch_seconds:null,raw_timestamp:"20261114014347"},
];

export const stories: Story[] = [
  {id:"story-4031843715077515167",published_at_raw:"20261116000000",descriptor:"Flooring and paint",impressions:116,reach:114,replies:0,exits:null,back_taps:2,forward_taps:90,permalink:"https://www.instagram.com/stories/opusplasticsurgery/4031843715077515167"},
  {id:"story-4031966853240316232",published_at_raw:"20261116000000",descriptor:"Instagram Story",impressions:108,reach:107,replies:0,exits:null,back_taps:3,forward_taps:86,permalink:"https://www.instagram.com/stories/opusplasticsurgery/4031966853240316232"},
  {id:"story-4032656203814612731",published_at_raw:"20261117000000",descriptor:"Instagram Story",impressions:525,reach:null,replies:null,exits:null,back_taps:1,forward_taps:7,permalink:"https://www.instagram.com/stories/opusplasticsurgery/4032656203814612731"},
  {id:"story-4032656717993249114",published_at_raw:"20261117000000",descriptor:"Instagram Story",impressions:289,reach:null,replies:null,exits:null,back_taps:1,forward_taps:3,permalink:"https://www.instagram.com/stories/opusplasticsurgery/4032656717993249114"},

  {id:"story-01",published_at_raw:"20261109232951",descriptor:"WHEN YOU WANT OPUS TO OPEN ALREADY",impressions:385,reach:309,replies:0,exits:17,back_taps:3,forward_taps:56,permalink:"https://www.instagram.com/stories/opusplasticsurgery/4026925872507317076"},
  {id:"story-02",published_at_raw:"20261110041853",descriptor:"Lights on ✨",impressions:244,reach:239,replies:1,exits:12,back_taps:8,forward_taps:77,permalink:"https://www.instagram.com/stories/opusplasticsurgery/4027071335893938056"},
  {id:"story-03",published_at_raw:"20261110175535",descriptor:"(no story text)",impressions:329,reach:276,replies:1,exits:3,back_taps:2,forward_taps:58,permalink:"https://www.instagram.com/stories/opusplasticsurgery/4027482400115753862"},
  {id:"story-04",published_at_raw:"20261110180448",descriptor:"(no story text)",impressions:300,reach:247,replies:0,exits:13,back_taps:3,forward_taps:55,permalink:"https://www.instagram.com/stories/opusplasticsurgery/4027487042540131963"},
  {id:"story-05",published_at_raw:"20261111190505",descriptor:"OPERATION: BIRTHDAY. Another year. Still operating.",impressions:603,reach:502,replies:2,exits:13,back_taps:1,forward_taps:63,permalink:"https://www.instagram.com/stories/opusplasticsurgery/4028242157500358456"},
  {id:"story-06",published_at_raw:"20261111194338",descriptor:"(no story text)",impressions:263,reach:230,replies:0,exits:12,back_taps:3,forward_taps:62,permalink:"https://www.instagram.com/stories/opusplasticsurgery/4028261564762149117"},
  {id:"story-07",published_at_raw:"20261112005543",descriptor:"(no story text)",impressions:85,reach:82,replies:0,exits:11,back_taps:2,forward_taps:64,permalink:"https://www.instagram.com/stories/opusplasticsurgery/4028418628042958579"},
  {id:"story-08",published_at_raw:"20261112172554",descriptor:"(no story text)",impressions:83,reach:83,replies:1,exits:8,back_taps:3,forward_taps:61,permalink:"https://www.instagram.com/stories/opusplasticsurgery/4028917016156957382"},
  {id:"story-09",published_at_raw:"20261112195345",descriptor:"(no story text)",impressions:76,reach:76,replies:0,exits:9,back_taps:6,forward_taps:48,permalink:"https://www.instagram.com/stories/opusplasticsurgery/4028991426934165974"},
  {id:"story-10",published_at_raw:"20261113183941",descriptor:"TAMARA’S ANSWERING YOUR QUESTIONS NEXT",impressions:296,reach:295,replies:0,exits:19,back_taps:0,forward_taps:66,permalink:"https://www.instagram.com/stories/opusplasticsurgery/4029678919615431097"},
  {id:"story-11",published_at_raw:"20261113222900",descriptor:"POV: my office manager said I have a superiority complex...",impressions:509,reach:439,replies:1,exits:15,back_taps:6,forward_taps:67,permalink:"https://www.instagram.com/stories/opusplasticsurgery/4029794339689513300"},
  {id:"story-12",published_at_raw:"20261114014354",descriptor:"(no story text)",impressions:81,reach:81,replies:0,exits:12,back_taps:4,forward_taps:69,permalink:"https://www.instagram.com/stories/opusplasticsurgery/4029892425459815224"}
];

export const coverage: Coverage[] = [
  {channel:"Instagram",account:"@opusplasticsurgery",status:"Connected",data:"3 feed posts + 12 Stories",limitation:"Account views and reach not returned Nov 14–15"},
  {channel:"Facebook",account:"OPUS Facebook",status:"Connected",data:"1 Reel + 1 carousel",limitation:"Sparse metrics; Reel 17 views with reported reach 0"},
  {channel:"TikTok",account:"@opusplasticsurgery",status:"Connected",data:"No post-level rows returned",limitation:"Insufficient observations to infer posting or weekly performance"},
  {channel:"YouTube",account:"Amy Do (connected)",status:"Connected",data:"No new video rows returned",limitation:"This is not the OPUS channel; its numbers must not be attributed to OPUS."},
  {channel:"Google Business Profile",account:"OPUS GBP",status:"Connected",data:"No media/post rows returned",limitation:"Only Nov 15 zero daily observation"},
  {channel:"Meta Ads",account:"OPUS Meta Ads",status:"Connected",data:"7 daily zero-spend, zero-click rows",limitation:"No campaign or ad rows were returned"},
  {channel:"Google Ads",account:"OPUS Google Ads",status:"Connected",data:"One zero row (Nov 15)",limitation:"Nov 9–14 absent: weekly spend unknown"},
  {channel:"Separate OPUS accounts",account:"@dr.frew / @opusresults / @drtylerfrew / OPUS YouTube",status:"Not included",data:"Separate account data",limitation:"These profiles are not linked to the connected OPUS brand."}
];

export const socialDaily: DailySocial[] = [
  {date:"2026-11-09",followers:288,account_views:1333,reach:480},
  {date:"2026-11-10",followers:289,account_views:1201,reach:509},
  {date:"2026-11-11",followers:289,account_views:985,reach:445},
  {date:"2026-11-12",followers:289,account_views:2276,reach:951},
  {date:"2026-11-13",followers:289,account_views:759,reach:314},
  {date:"2026-11-14",followers:289,account_views:251,reach:82},
  {date:"2026-11-15",followers:289,account_views:1201,reach:561},
  {date:"2026-11-16",followers:null,account_views:null,reach:null},
  {date:"2026-11-17",followers:null,account_views:null,reach:null}
];

export const adsDaily: AdsDay[] = [
  {date:"2026-11-09",meta_spend:0,meta_impressions:0,meta_clicks:0,google_spend:null,google_impressions:null,google_clicks:null},
  {date:"2026-11-10",meta_spend:0,meta_impressions:0,meta_clicks:0,google_spend:null,google_impressions:null,google_clicks:null},
  {date:"2026-11-11",meta_spend:0,meta_impressions:0,meta_clicks:0,google_spend:null,google_impressions:null,google_clicks:null},
  {date:"2026-11-12",meta_spend:0,meta_impressions:0,meta_clicks:0,google_spend:null,google_impressions:null,google_clicks:null},
  {date:"2026-11-13",meta_spend:0,meta_impressions:0,meta_clicks:0,google_spend:null,google_impressions:null,google_clicks:null},
  {date:"2026-11-14",meta_spend:0,meta_impressions:0,meta_clicks:0,google_spend:null,google_impressions:null,google_clicks:null},
  {date:"2026-11-15",meta_spend:0,meta_impressions:0,meta_clicks:0,google_spend:0,google_impressions:0,google_clicks:0}
];

export const insights: Insight[] = [
  {id:"find-1",kind:"finding",position:1,title:"The scar Reel draws attention—but fewer interactions per view",body:"Scar: 1,459 views and 22 interactions. Consultation: 555 views and 26 interactions. These are different posts with different exposure periods."},
  {id:"find-2",kind:"finding",position:2,title:"Early retention favors the scar hook",body:"Three-second skip was 36.7% for the scar Reel versus 46.8% for the consultation Reel. One comparison does not establish causation."},
  {id:"find-3",kind:"finding",position:3,title:"Story replies are a small but real engagement signal",body:"12 stories generated 3,254 impressions and 6 replies. The birthday story generated 603 impressions and 2 replies."},
  {id:"action-1",kind:"action",position:1,title:"Test another specific surgical observation",body:"Open a new Reel with a patient-relevant detail and measure three-second skips against comparable recent Reels."},
  {id:"action-2",kind:"action",position:2,title:"Sharpen the carousel takeaway",body:"The belly-bulge carousel has 937 views, 7 interactions and zero saves as of Nov 19. Give the next carousel one concrete question worth saving."},
  {id:"action-3",kind:"action",position:3,title:"Close the loop on consultations",body:"Connect comments, DMs and tracked consult requests to content where possible; do not equate social engagement with bookings."},
  {id:"caveat-1",kind:"caveat",position:1,title:"Not all channels returned complete data",body:"TikTok returned no usable video data despite a connected profile; YouTube is linked to Amy Do instead of OPUS; GBP has no current week totals. Other OPUS profiles are not linked."},
  {id:"caveat-2",kind:"caveat",position:2,title:"Zero and missing are not interchangeable",body:"Meta Ads returned seven actual zero-spend days. Google Ads returned only a zero on Nov 15; the preceding six days are unknown."}
];

export const experiments: Experiment[] = [
  {id:"experiment-1",title:"Specific surgical hooks vs broad educational openings",hypothesis:"Concrete surgical-detail openings may reduce early skip rate relative to broad educational framing.",status:"proposed",notes:"Future test: three comparable Reels, analyzing skips, shares, saves and qualified inquiries. The observed comparison is not causal."}
];
