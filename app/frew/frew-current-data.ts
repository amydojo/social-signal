import type {LeadershipChannel,LeadershipLog} from "./frew-data";

/**
 * OPUS Weekly Pulse / week of November 16–22, 2026.
 * Connected brand 7930515; captured November 19, approximately midday Pacific.
 * Content dates are source-reported (not timezone-converted).
 * Post views/interactions are cumulative AT CAPTURE, not traffic earned in the week.
 * Paid delivery uses completed Nov 16–18 calendar days only.
 * Missing or late-returning channel data is never zeroed.
 */

function item(
  id:string,date:string,platform:string,account:string,format:string,
  title:string,url:string|null,views:number|null,
  metrics:Partial<Pick<LeadershipLog,"likes"|"comments"|"shares"|"saves">>={}
):LeadershipLog{
  return {id,date,platform,account,format,title,url,views,
    likes:null,comments:null,shares:null,saves:null,...metrics,
    status:null,ctaChecked:null,complianceChecked:null};
}
const ig="@opusplasticsurgery";
const fb="OPUS Plastic Surgery";
export const currentLog:LeadershipLog[]=[
  item("ig-implants-firmness","2026-11-19","Instagram",ig,"Carousel",
    "Why does one implant feel harder?","https://www.instagram.com/p/Df56bphCVA0/",343,{likes:3,saves:0}),
  item("fb-implants-firmness","2026-11-19","Facebook",fb,"Carousel",
    "Why does one implant feel harder?","https://facebook.com/122123175627459507/posts/122125310511459507",null),
  item("fb-reel-new-1119","2026-11-19","Facebook",fb,"Reel",
    "New Facebook Reel","https://www.facebook.com/reel/2488636204947463/",null),
  item("ig-reel-team-qa","2026-11-18","Instagram",ig,"Reel",
    "Dr. Frew + Tamara: office Q&A","https://www.instagram.com/reel/Df3UbiPBzO8/",1458,
    {likes:33,comments:5,shares:2,saves:0}),
  item("fb-reel-team-qa","2026-11-18","Facebook",fb,"Reel",
    "Dr. Frew + Tamara: office Q&A","https://www.facebook.com/reel/1806214670618082/",197,
    {likes:1}),
  item("ig-reel-implants-fit","2026-11-17","Instagram",ig,"Reel",
    "How do breast implants fit?","https://www.instagram.com/reel/Df0yAMmsZ2p/",1039,
    {likes:28,comments:0,shares:4,saves:1}),
  item("w46-story-01","2026-11-18","Instagram",ig,"Story",
    "Instagram Story","https://www.instagram.com/stories/opusplasticsurgery/4033289804016279060",281),
  item("w46-story-02","2026-11-18","Instagram",ig,"Story",
    "Never been so happy about cabinets 😂","https://www.instagram.com/stories/opusplasticsurgery/4033276613919404564",97),
  item("w46-story-03","2026-11-17","Instagram",ig,"Story","Instagram Story",null,104),
  item("w46-story-04","2026-11-17","Instagram",ig,"Story","Instagram Story",null,34),
  item("w46-story-05","2026-11-17","Instagram",ig,"Story","Instagram Story",null,51),
  item("w46-story-06","2026-11-17","Instagram",ig,"Story","Instagram Story",
    "https://www.instagram.com/stories/opusplasticsurgery/4032656717993249114",289),
  item("w46-story-07","2026-11-17","Instagram",ig,"Story","Instagram Story",
    "https://www.instagram.com/stories/opusplasticsurgery/4032656203814612731",525),
  item("w46-story-08","2026-11-16","Instagram",ig,"Story","Instagram Story",
    "https://www.instagram.com/stories/opusplasticsurgery/4031966853240316232",108),
  item("w46-story-09","2026-11-16","Instagram",ig,"Story",
    "Flooring and paint ✅ Let’s gooooo!! 🙌",
    "https://www.instagram.com/stories/opusplasticsurgery/4031843715077515167",116)
].sort((a,b)=>b.date.localeCompare(a.date));

/** Original Instagram cover URLs; temporary source fallback until permanent archival. */
export const currentCoverFallbacks:Record<string,string> = {
  "https://www.instagram.com/reel/Df3UbiPBzO8/": "https://scontent-lhr6-1.cdninstagram.com/v/t51.82787-15/902954551_1078740181788006_2139143540724689383_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=102&_nc_map=urlgen_bucketless&ccb=7-5&_nc_sid=18de74&efg=eyJlZmdfdGFnIjoiQ0xJUFMuYmVzdF9pbWFnZV91cmxnZW4uQzMifQ%3D%3D&_nc_ohc=PpySCLfdJ_8Q7kNvwFVpk7B&_nc_oc=AdqK9w7MJoJPZCSZDwaLAHRDMBzgOjJs5ApjFrWvvqH2eNFq9NhplItc5BvN3cvF_44&_nc_zt=23&_nc_ht=scontent-lhr6-1.cdninstagram.com&edm=AFF3FJ0EAAAA&_nc_gid=lM7DjoiUaMnEV--2LCkfNw&_nc_tpa=Q5bMBQKpNF5XfA5yLe1KKryJ20reWeLEizMig86eh_lvmd9R8g-dVB0ittJIX8dfmbsVpDgGMxRtJTc_&_nc_ct=RQosPBUKFQwAAAA&oh=00_AQTcWbBh4AGxN8ZS4n6i_deruX3Qe7meezXcpbpUJ-lXZg&oe=6B04F469",
  "https://www.instagram.com/reel/Df0yAMmsZ2p/": "https://scontent-lhr11-1.cdninstagram.com/v/t51.71878-15/914356611_29018176371138336_4814719437669342271_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=108&_nc_map=urlgen_bucketless&ccb=7-5&_nc_sid=18de74&efg=eyJlZmdfdGFnIjoiQ0xJUFMuYmVzdF9pbWFnZV91cmxnZW4uQzMifQ%3D%3D&_nc_ohc=_rqEhc65Ni4Q7kNvwHbAGYN&_nc_oc=Adr4d0CP92w4Lek7xE5x7Flrkb8xXNolhytdecXXlHdPEJp-Kh3limEXmOKHuXLcREM&_nc_zt=23&_nc_ht=scontent-lhr11-1.cdninstagram.com&edm=AFF3FJ0EAAAA&_nc_gid=lM7DjoiUaMnEV--2LCkfNw&_nc_tpa=Q5bMBQIQ1Azle-sb5HAqiXwshIP9B5ZUsRNWkgD5u2dy_TaEqQAatXI-zVpUadOuDAnyLJn2rGsG3Alh&_nc_ct=RQosPBUKFQ4AAAA&oh=00_AQQt9gf4VLuRApY6EkXlyDoP8uwHCJTxXKjPlT1rOyuBrw&oe=6B04EF47"
};

export const currentStats={
  instagramFeedViews:2840, // 1458 + 1039 + 343; 3 posts, as of Nov 19
  instagramFeedInteractions:76, // 40 + 33 + 3
  instagramReelViews:2497, // 1458 + 1039
  instagramReelInteractions:73, // 40 + 33
  storyImpressions:1605, // all nine documented stories, through Nov 18
  storyReplies:2,
  googleAdsConversions:5,
  googleAdsClicks:27,
  googleAdsSpend:76.28,
  facebookReelViews:197,
  facebookReelInteractions:1,
  tiktokFollowers:8, // Nov 18 account snapshot
  tiktokAccountLikes:189 // Nov 18 account-level likes; NOT weekly video likes
};

export const currentChannels:LeadershipChannel[]=[
  {platform:"Instagram",account:ig,period:"Nov 16–19 · WTD",source:"metricool",
    metrics:[
      {label:"Feed views",value:currentStats.instagramFeedViews},
      {label:"Feed interactions",value:currentStats.instagramFeedInteractions},
      {label:"Stories",value:9},
      {label:"Story impressions",value:currentStats.storyImpressions},
      {label:"Story replies",value:currentStats.storyReplies}
    ]},
  {platform:"Google Ads",account:"OPUS Search · Upland",period:"Nov 16–18",source:"metricool",
    metrics:[
      {label:"Conversions",value:currentStats.googleAdsConversions},
      {label:"Clicks",value:currentStats.googleAdsClicks},
      {label:"Spend",value:currentStats.googleAdsSpend,unit:"USD"}
    ],note:"Platform conversions; bookings not independently confirmed"},
  {platform:"Facebook",account:fb,period:"Nov 16–19 · WTD",source:"metricool",
    metrics:[
      {label:"Posts",value:3},
      {label:"Reel views",value:currentStats.facebookReelViews},
      {label:"Carousel impressions",value:2}
    ],note:"Other newly published Reel metrics pending"},
  {platform:"TikTok",account:ig,period:"Nov 18 snapshot",source:"metricool",
    metrics:[
      {label:"Followers",value:currentStats.tiktokFollowers},
      {label:"Account likes",value:currentStats.tiktokAccountLikes}
    ],note:"No new video rows Nov 16–19"},
  {platform:"Google Business Profile",account:"OPUS · Upland",period:"Nov 16–18",source:"metricool",
    metrics:[],note:"Weekly totals unavailable"},
  {platform:"Meta Ads",account:"OPUS",period:"Nov 16–18",source:"metricool",
    metrics:[{label:"Spend",value:0,unit:"USD"},{label:"Clicks",value:0},{label:"Impressions",value:0}],
    note:"No delivery reported on these three days"}
];
