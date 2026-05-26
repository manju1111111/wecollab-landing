export type Platform = "Instagram" | "YouTube" | "TikTok" | "X";

export type Creator = {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  category: string;
  platforms: {
    name: Platform;
    followers: number;
    url: string;
  }[];
  totalFollowers: number;
  bio: string;
  location: string;
  rating: number;
  engagementRate: number; // percentage
  verified: boolean;
  score: number;
  avgLikes: string;
  avgReelViews: string;
};

export const MOCK_CREATORS: Creator[] = [
  {
    id: "c_001",
    name: "Elena Rodriguez",
    handle: "@elenastyles",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&q=80",
    category: "Fashion",
    platforms: [
      { name: "Instagram", followers: 450000, url: "#" },
      { name: "TikTok", followers: 800000, url: "#" },
    ],
    totalFollowers: 1250000,
    bio: "NYC-based fashion and lifestyle creator focusing on sustainable, everyday street style.",
    location: "New York, USA",
    rating: 4.9,
    engagementRate: 5.2,
    verified: true,
    score: 9.41,
    avgLikes: "1.4m",
    avgReelViews: "16m",
  },
  {
    id: "c_002",
    name: "Marcus Chen",
    handle: "@marcuscodes",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&q=80",
    category: "Tech",
    platforms: [
      { name: "YouTube", followers: 1200000, url: "#" },
      { name: "X", followers: 200000, url: "#" },
    ],
    totalFollowers: 1400000,
    bio: "Software engineer breaking down complex concepts, gadgets, and tech news for everyone.",
    location: "San Francisco, USA",
    rating: 4.8,
    engagementRate: 8.5,
    verified: true,
    score: 9.23,
    avgLikes: "507.3k",
    avgReelViews: "7.9m",
  },
  {
    id: "c_003",
    name: "Sarah Jenkins",
    handle: "@sarahcooks",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&q=80",
    category: "Food",
    platforms: [
      { name: "Instagram", followers: 320000, url: "#" },
      { name: "YouTube", followers: 500000, url: "#" },
      { name: "TikTok", followers: 1500000, url: "#" },
    ],
    totalFollowers: 2320000,
    bio: "Self-taught chef sharing easy weeknight dinners and wild baking experiments.",
    location: "London, UK",
    rating: 4.9,
    engagementRate: 11.2,
    verified: true,
    score: 9.37,
    avgLikes: "1.1m",
    avgReelViews: "15.3m",
  },
  {
    id: "c_004",
    name: "David Kim",
    handle: "@davidlifts",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&q=80",
    category: "Fitness",
    platforms: [
      { name: "Instagram", followers: 85000, url: "#" },
      { name: "YouTube", followers: 220000, url: "#" },
    ],
    totalFollowers: 305000,
    bio: "Certified personal trainer. I help you build muscle and eat right without giving up pizza.",
    location: "Los Angeles, USA",
    rating: 4.7,
    engagementRate: 6.8,
    verified: false,
    score: 8.92,
    avgLikes: "21.5k",
    avgReelViews: "340k",
  },
  {
    id: "c_005",
    name: "Amira Hassan",
    handle: "@amiratravels",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&q=80",
    category: "Travel",
    platforms: [
      { name: "Instagram", followers: 1100000, url: "#" },
      { name: "TikTok", followers: 600000, url: "#" },
    ],
    totalFollowers: 1700000,
    bio: "Full-time nomad exploring hidden gems and sharing budget travel hacks.",
    location: "Dubai, UAE",
    rating: 4.9,
    engagementRate: 4.5,
    verified: true,
    score: 9.05,
    avgLikes: "85.2k",
    avgReelViews: "1.2m",
  },
  {
    id: "c_006",
    name: "Leo & Maya",
    handle: "@leomayagames",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop&q=80",
    category: "Gaming",
    platforms: [
      { name: "YouTube", followers: 2500000, url: "#" },
      { name: "TikTok", followers: 3100000, url: "#" },
    ],
    totalFollowers: 5600000,
    bio: "Couple gaming channel playing co-op adventures, competitive shooters, and indie gems.",
    location: "Toronto, Canada",
    rating: 4.6,
    engagementRate: 9.1,
    verified: true,
    score: 9.83,
    avgLikes: "8.5m",
    avgReelViews: "30.8m",
  },
  {
    id: "c_007",
    name: "Chloe Smith",
    handle: "@chloelife",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop&q=80",
    category: "Lifestyle",
    platforms: [
      { name: "Instagram", followers: 65000, url: "#" },
    ],
    totalFollowers: 65000,
    bio: "Interior design, coffee shop aesthetic, and romanticizing everyday life.",
    location: "Paris, France",
    rating: 4.8,
    engagementRate: 15.4, // micro-influencer high engagement
    verified: false,
    score: 8.45,
    avgLikes: "9.8k",
    avgReelViews: "45k",
  },
  {
    id: "c_008",
    name: "James Wilson",
    handle: "@jamesbuilds",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&q=80",
    category: "Tech",
    platforms: [
      { name: "YouTube", followers: 850000, url: "#" },
      { name: "Instagram", followers: 120000, url: "#" },
    ],
    totalFollowers: 970000,
    bio: "PC builds, mechanical keyboards, and everything custom tech hardware.",
    location: "Austin, USA",
    rating: 4.9,
    engagementRate: 7.2,
    verified: true,
    score: 9.12,
    avgLikes: "62.4k",
    avgReelViews: "890k",
  },
];
