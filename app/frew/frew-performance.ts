/** Verified post and channel diagnostics for Weekly Pulse.
 * November 19, 2026 source capture; dates are content publication dates.
 * Cumulative post-level views/interactions, not views earned during this week.
 * Stories describe navigation events; story reach is NOT deduplicated across items.
 * Paid conversions are platform-reported actions, not verified booked consults.
 */
export type ReelSignal={
  id:string;title:string;views:number;reach:number;interactions:number;
  avgWatchSeconds:number;past3SecondsPct:number;skip3SecondsPct:number;
  shares:number;saves:number;
};
export type StorySignal={
  count:number;impressions:number;replies:number;exits:number;backTaps:number;forwardTaps:number;
};
export type PerformanceWeek={
  reels:ReelSignal[];
  stories:StorySignal;
  keyword?:{term:string;conversions:number;clicks:number;spend:number;impressions:number};
  audience?:{instagramFollowers:number|null;asOf:string;engagedByDay:{date:string;accounts:number}[]};
};
export const performanceByWeek:Record<"2026-11-16"|"2026-11-09",PerformanceWeek>={
  "2026-11-16":{
    reels:[
      {id:"ig-reel-team-qa",title:"Dr. Frew + Tamara Q&A",views:1458,reach:948,interactions:40,
       avgWatchSeconds:13.269,past3SecondsPct:59.1,skip3SecondsPct:40.9,shares:2,saves:0},
      {id:"ig-reel-implants-fit",title:"How do breast implants fit?",views:1039,reach:737,interactions:33,
       avgWatchSeconds:8.968,past3SecondsPct:59.8,skip3SecondsPct:40.2,shares:4,saves:1}
    ],
    stories:{count:9,impressions:1605,replies:2,exits:102,backTaps:22,forwardTaps:439},
    keyword:{term:"tummy tuck",conversions:5,clicks:18,spend:53.726133,impressions:68},
    audience:{instagramFollowers:297,asOf:"Nov 17",engagedByDay:[
      {date:"Nov 16",accounts:30},{date:"Nov 17",accounts:24}
    ]}
  },
  "2026-11-09":{
    reels:[
      {id:"ig-reel-scar",title:"What a scar can't show",views:1459,reach:1134,interactions:22,
       avgWatchSeconds:8.567,past3SecondsPct:63.3,skip3SecondsPct:36.7,shares:3,saves:1},
      {id:"ig-reel-keep",title:"What you want to keep",views:555,reach:362,interactions:26,
       avgWatchSeconds:8.069,past3SecondsPct:53.2,skip3SecondsPct:46.8,shares:1,saves:0}
    ],
    stories:{count:12,impressions:3254,replies:6,exits:144,backTaps:41,forwardTaps:746}
  }
};
