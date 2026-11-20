/**
 * Verified, public-safe reporting extracts from the connected
 * "Opus Weekly Social Insights" native Google Sheet, read Nov 16, 2026.
 * Source range: Posts Log A1:Q33, IG/TikTok/YouTube/GBP Weekly,
 * Amy Notes and How To. These are historical snapshots, NOT live sync.
 *
 * Do not store screenshots, patient details, private CRM records,
 * approval comments, or unreviewed internal notes here: /frew is PUBLIC.
 */
export type LeadershipMetric = {label:string;value:number|null;unit?:string};
export type LeadershipChannel = {
  platform:string;account:string;metrics:LeadershipMetric[];
  note?:string;source:"sheet"|"metricool"|"derived";period:string;
};
export type LeadershipLog = {
  id:string;date:string;platform:string;account:string;format:string;
  title:string;url:string|null;views:number|null;likes:number|null;
  /** When ingestion saves an asset, this immutable local path is preferred. */
  thumbnailPath?:string|null;
  /** Source-provided image, only used if no local archived thumbnail exists. */
  coverUrl?:string|null;
  comments:number|null;shares:number|null;saves:number|null;
  /** Provider-supplied interaction aggregate. May be known when breakdown fields are not. */
  interactions?:number|null;
  /** Impression counts are distinct from views (notably Facebook albums). */
  impressions?:number|null;
  status:"On time"|"Late"|"Skipped"|null;
  ctaChecked:boolean|null;complianceChecked:boolean|null;
};

export const nov2Channels:LeadershipChannel[]=[
 {platform:"Instagram",account:"@opusplasticsurgery",period:"Nov 2–6",source:"sheet",metrics:[{label:"Followers",value:280},{label:"Gained",value:12},{label:"Reach",value:1112},{label:"Engaged",value:85},{label:"Story views",value:911},{label:"Story replies",value:1}]},
 {platform:"Instagram",account:"@dr.frew",period:"Nov 2–6",source:"sheet",metrics:[{label:"Followers",value:2394},{label:"Gained",value:9},{label:"Reach",value:6978},{label:"Engaged",value:140},{label:"Story views",value:3300},{label:"Story replies",value:6}]},
 {platform:"Instagram",account:"@opusresults",period:"Nov 2–6",source:"sheet",metrics:[{label:"Followers",value:39},{label:"Gained",value:null},{label:"Reach",value:0},{label:"Engaged",value:0},{label:"Story views",value:0},{label:"Story replies",value:null}]},
 {platform:"TikTok",account:"@opusplasticsurgery",period:"Nov 2–6",source:"sheet",metrics:[{label:"Followers",value:8},{label:"Gained",value:1},{label:"Video views",value:309},{label:"Profile views",value:4}]},
 {platform:"TikTok",account:"@drtylerfrew",period:"Nov 2–6",source:"sheet",metrics:[{label:"Followers",value:846},{label:"Gained",value:0},{label:"Video views",value:269},{label:"Profile views",value:8}]},
 {platform:"YouTube",account:"OPUS channel",period:"Nov 2–6",source:"sheet",metrics:[{label:"Subscribers",value:0},{label:"Gained",value:0},{label:"Views",value:0},{label:"Watch time",value:0,unit:"hrs"}],note:"Posting requires channel-owner verification (per reporting sheet)"},
 {platform:"Google Business Profile",account:"OPUS · Upland",period:"Nov 2–6",source:"sheet",metrics:[{label:"Searches",value:34},{label:"Profile views",value:15},{label:"Calls",value:1},{label:"Website clicks",value:4},{label:"Directions",value:18},{label:"New reviews",value:0}]}
];

// Reporting rows in the exact Posts Log, including the two Nov 8 stories.
// Unknown fields are null, not zero or "Skipped".
export const nov2Log:LeadershipLog[]=[
 {id:"n2-ig-lipo",date:"2026-11-03",platform:"Instagram",account:"@opusplasticsurgery",format:"Reel",title:"Lipo + tummy tuck",url:"https://www.instagram.com/reel/DfTRuknpjs4/",views:1052,likes:24,comments:0,shares:2,saves:0,status:null,ctaChecked:null,complianceChecked:null},
 {id:"n2-fb-lipo",date:"2026-11-03",platform:"Facebook",account:"OPUS Plastic Surgery",format:"Reel",title:"Lipo + tummy tuck",url:"https://www.facebook.com/reel/1149006984234928/",views:41,likes:0,comments:null,shares:null,saves:null,status:null,ctaChecked:null,complianceChecked:null},
 {id:"n2-gbp-build",date:"2026-11-03",platform:"Google Business Profile",account:"OPUS Upland",format:"Post",title:"Behind the Build",url:"https://local.google.com/place?id=5701519846570423789&use=posts&lpsid=CAIQACoeChxtc3BfaDpxR0RmT3FFQW5iWEt1UDlrUmY1V2ZR",views:null,likes:null,comments:null,shares:null,saves:null,status:null,ctaChecked:null,complianceChecked:null},
 {id:"n2-ig-before",date:"2026-11-04",platform:"Instagram",account:"@opusplasticsurgery",format:"Carousel",title:"Before / after",url:"https://www.instagram.com/p/DfV4gNXGqE5/",views:941,likes:15,comments:1,shares:null,saves:0,status:null,ctaChecked:null,complianceChecked:null},
 {id:"n2-fb-before",date:"2026-11-04",platform:"Facebook",account:"OPUS Plastic Surgery",format:"Carousel",title:"Before / after",url:"https://facebook.com/122123175627459507/posts/122122817157459507",views:1,likes:0,comments:0,shares:0,saves:null,status:null,ctaChecked:null,complianceChecked:null},
 {id:"n2-ig-tamara",date:"2026-11-05",platform:"Instagram",account:"@opusplasticsurgery",format:"Reel",title:"Meet Tamara",url:"https://www.instagram.com/reel/DfYdRdXMZGy/",views:1422,likes:20,comments:0,shares:3,saves:0,status:null,ctaChecked:null,complianceChecked:null},
 {id:"n2-ig-lipo2",date:"2026-11-06",platform:"Instagram",account:"@opusplasticsurgery",format:"Carousel",title:"Tummy tuck vs. lipo",url:"https://www.instagram.com/p/DfbA4-kCWIU/",views:451,likes:9,comments:0,shares:null,saves:0,status:null,ctaChecked:null,complianceChecked:null},
 {id:"n2-fb-lipo2",date:"2026-11-06",platform:"Facebook",account:"OPUS Plastic Surgery",format:"Carousel",title:"Tummy tuck vs. lipo",url:"https://facebook.com/122123175627459507/posts/122123193267459507",views:0,likes:0,comments:0,shares:0,saves:null,status:null,ctaChecked:null,complianceChecked:null},
 {id:"n2-story1",date:"2026-11-06",platform:"Instagram",account:"@opusplasticsurgery",format:"Story",title:"Instagram Story 1 · Nov 6",url:null,views:729,likes:null,comments:null,shares:null,saves:null,status:null,ctaChecked:null,complianceChecked:null},
 {id:"n2-story2",date:"2026-11-06",platform:"Instagram",account:"@opusplasticsurgery",format:"Story",title:"Instagram Story 2 · Nov 6",url:null,views:82,likes:null,comments:null,shares:null,saves:null,status:null,ctaChecked:null,complianceChecked:null},
 {id:"n2-story3",date:"2026-11-06",platform:"Instagram",account:"@opusplasticsurgery",format:"Story",title:"Instagram Story 3 · Nov 6",url:null,views:234,likes:null,comments:null,shares:null,saves:null,status:null,ctaChecked:null,complianceChecked:null},
 {id:"n2-story4",date:"2026-11-08",platform:"Instagram",account:"@opusplasticsurgery",format:"Story",title:"Instagram Story · Nov 8",url:"https://www.instagram.com/stories/opusplasticsurgery/4026028703817292544",views:null,likes:null,comments:null,shares:null,saves:null,status:null,ctaChecked:null,complianceChecked:null},
 {id:"n2-story5",date:"2026-11-08",platform:"Instagram",account:"@opusplasticsurgery",format:"Story",title:"Instagram Story · Nov 8",url:"https://www.instagram.com/stories/opusplasticsurgery/4026086809062875268",views:null,likes:null,comments:null,shares:null,saves:null,status:null,ctaChecked:null,complianceChecked:null}
];

export const nov2Notes={
  topPosts:"The source notes identify Meet Tamara and Lipo + tummy tuck as the strongest posts.",
  observation:"Team introductions and straightforward explanations were the strongest themes identified in the weekly notes.",
  questions:"Not recorded; comments and DMs still required review.",
  discrepancy:"Posts Log lists Meet Tamara at 1,422 views and Lipo + tummy tuck at 1,052. Amy Notes lists 1,462 and 1,061. These reflect different recorded values and are not reconciled.",
  completeness:"The source sheet's Status, CTA and Compliance columns are blank for every logged post. Nov 6 Story links and Nov 8 Story reach were also requested for completion."
};
