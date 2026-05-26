"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, SlidersHorizontal, Search } from "lucide-react";

export const CATEGORY_GROUPS = [
  {
    title: "Video Format",
    items: ["Face-showing (talking head)", "Faceless creator", "POV-style", "Voice-over only", "Screen recording", "Animation / motion graphics", "Whiteboard / explainer", "Reaction content", "Commentary style", "Vlog (daily life cam)", "Cinematic / film style", "Live streaming", "Short-form (Reels/Shorts/TikTok)", "Text-on-screen only"]
  },
  {
    title: "Hair",
    items: ["Natural hair", "Relaxed / chemically treated hair", "Hair growth & scalp health", "Hair coloring & dyeing", "Braids & protective styles", "Wigs & extensions", "Men's hair & grooming", "Kids' hair", "Hair tools & heat styling", "Curly hair (3A–4C)", "Hair loss / thinning", "Loc journey", "Big chop / hair transformation", "Straight hair care", "Hair product reviews", "Salon-style tutorials", "Eco / sustainable hair care", "Gray hair & aging hair"]
  },
  {
    title: "Skin & Beauty",
    items: ["Skincare routine", "Acne & blemish care", "Anti-aging & serums", "Sun care & SPF", "Natural / clean beauty", "Dermatologist-style advice", "Skin of color focus", "Body skincare", "Fragrance & perfume", "Nail art & care", "Makeup tutorials", "GRWM (get ready with me)", "Makeup reviews", "No-makeup / minimal beauty", "Inclusive beauty", "Drugstore beauty", "Luxury beauty", "Skincare ingredient deep dives"]
  },
  {
    title: "Unboxing & Reviews",
    items: ["Tech unboxing", "Beauty / skincare unboxing", "Subscription box unboxing", "Fashion haul unboxing", "Kids' toy unboxing", "Food & snack unboxing", "Mystery box unboxing", "Luxury item unboxing", "Amazon finds", "Honest product reviews", "First impressions", "Compare & contrast reviews", "Long-term review / wear test", "Worst vs best product ranking"]
  },
  {
    title: "Fashion & Style",
    items: ["Outfit of the day (OOTD)", "Thrift & secondhand fashion", "Luxury & designer fashion", "Budget / affordable fashion", "Plus-size fashion", "Modest fashion", "Streetwear", "Sustainable fashion", "Men's fashion", "Capsule wardrobe", "Styling tips & tricks", "Trend forecasting"]
  },
  {
    title: "Food & Beverage",
    items: ["Recipe tutorials", "Restaurant reviews", "Food mukbang", "Baking & pastry", "Healthy eating", "Vegan / plant-based", "Cultural / ethnic cuisine", "Street food exploration", "Meal prep & batch cooking", "Coffee & café culture", "Cocktails & mixology", "Budget meal cooking", "Food science & chemistry", "Kids' friendly cooking", "ASMR cooking / eating", "Grocery hauls"]
  },
  {
    title: "Health & Wellness",
    items: ["Mental health awareness", "Meditation & mindfulness", "Sleep optimization", "Gut health & digestion", "Hormonal health", "Chronic illness / disability", "Therapy & self-help", "Detox & cleansing", "Supplements & vitamins", "Women's health", "Men's health", "Sobriety & recovery", "Breathwork & stress relief", "Holistic / alternative health"]
  },
  {
    title: "Fitness & Sports",
    items: ["Home workouts", "Gym training", "Weight loss journey", "Bodybuilding & physique", "Yoga & pilates", "Running & endurance", "CrossFit & HIIT", "Sports-specific training", "Calisthenics", "Dance fitness", "Prenatal / postnatal fitness", "Senior fitness", "Physical therapy & rehab", "Athlete performance"]
  },
  {
    title: "Tech & Gadgets",
    items: ["Smartphone reviews", "Laptop & PC reviews", "Smart home devices", "Wearables & accessories", "Gaming peripherals", "Camera & photography gear", "Audio gear", "EV & car tech", "AI tools & software", "App reviews", "Budget tech", "Teardowns & repairs", "Setup / desk tour", "Futurism & emerging tech"]
  },
  {
    title: "Gaming & Entertainment",
    items: ["Game walkthroughs", "Let's play", "Game reviews", "Esports & competitive gaming", "Mobile gaming", "Retro gaming", "Game mods & customization", "Game lore & storytelling", "Speedrunning", "Gaming news & leaks", "Anime reviews & recommendations", "Movie & TV reviews", "Podcast / commentary shows"]
  },
  {
    title: "Lifestyle & Daily Life",
    items: ["Morning routine", "Night routine", "Productive day in my life", "Slow living & minimalism", "Luxury lifestyle", "College / student life", "Single life", "Couple life", "Solo female living", "Roommate life", "City living", "Rural / countryside living", "Expat life", "Digital nomad lifestyle", "Work from home life"]
  },
  {
    title: "Home & Living",
    items: ["Home decor & interior design", "DIY & home improvement", "Apartment tours", "Cleaning & organization", "Small space living", "Sustainable home", "Renting tips", "Home buying journey", "Room makeovers", "Feng shui & home energy", "Plant parenthood", "Furniture flipping & thrifting"]
  },
  {
    title: "Parenting & Family",
    items: ["Newborn & baby care", "Toddler parenting", "Homeschooling", "Single parenting", "Blended family life", "Pregnancy & birth journey", "Postpartum recovery", "Teen parenting", "Special needs parenting", "Family travel"]
  },
  {
    title: "Travel & Outdoors",
    items: ["Budget travel", "Luxury travel", "Solo travel", "Backpacking", "Van life / nomadic travel", "City guides & travel tips", "Adventure travel", "Beach & island travel", "Cultural immersion travel", "Road trips", "Travel hacks & packing", "Eco & sustainable travel", "Cruise & resort travel"]
  },
  {
    title: "Finance & Business",
    items: ["Personal finance & budgeting", "Investing", "Crypto & Web3", "Real estate investing", "Side hustles & income ideas", "Entrepreneurship & startups", "Frugal living & saving", "Financial independence (FIRE)", "Career growth & salary", "Small business tips", "Passive income strategies"]
  },
  {
    title: "Education & Learning",
    items: ["Study tips & productivity", "Language learning", "Science & nature", "History & culture", "Philosophy & ethics", "Mathematics", "Coding & programming", "Psychology & human behavior", "Book summaries & reviews", "Online course reviews", "Self-improvement & habits", "Critical thinking & debate"]
  },
  {
    title: "Arts & Creativity",
    items: ["Illustration & drawing", "Painting", "Digital art & graphic design", "Photography", "Videography & editing", "Pottery & ceramics", "Knitting, sewing & crafts", "Music production", "Singing & vocal coaching", "Creative writing & poetry", "Street art & murals"]
  },
  {
    title: "Pets & Animals",
    items: ["Dog care & training", "Cat care", "Exotic pets", "Aquariums & fish keeping", "Pet nutrition & health", "Animal rescue & adoption", "Wildlife & nature content", "Pet product reviews"]
  },
  {
    title: "Spirituality & Mindfulness",
    items: ["Astrology & birth charts", "Tarot & oracle readings", "Crystal healing & energy", "Law of attraction & manifestation", "Religious / faith-based content", "Meditation & breathwork", "Journaling & shadow work", "Numerology & human design"]
  },
  {
    title: "Social Causes & Advocacy",
    items: ["Body positivity & self-love", "LGBTQ+ advocacy", "Racial justice & equity", "Environmental activism", "Mental health destigmatization", "Disability & accessibility", "Feminist content", "Political commentary", "Humanitarian & charity work"]
  }
];

export function AdvancedFilterPanel({ 
  onFilterChange 
}: { 
  onFilterChange: (filters: any) => void 
}) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    basic: true,
    performance: false,
    business: false,
  });

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="w-80 shrink-0 h-full border-r border-slate-200 bg-white flex flex-col">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-indigo-600" />
          <h2 className="text-[14px] font-bold text-slate-900">Advanced Filters</h2>
        </div>
        <button className="text-[12px] font-semibold text-slate-500 hover:text-indigo-600">
          Reset
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        {/* 1. BASIC FILTERS */}
        <div className="mb-1">
          <button 
            onClick={() => toggleSection("basic")}
            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <span className="text-[13px] font-bold text-slate-800 uppercase tracking-wide">1. Basic Filters</span>
            {openSections["basic"] ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
          </button>
          
          {openSections["basic"] && (
            <div className="p-2 space-y-3">
              <div>
                <label className="text-[12px] font-medium text-slate-600 mb-1 block">Name / Username</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input type="text" className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-[13px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="Search..." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[12px] font-medium text-slate-600 mb-1 block">Gender</label>
                  <select className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-[13px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                    <option>Any</option>
                    <option>Female</option>
                    <option>Male</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-[12px] font-medium text-slate-600 mb-1 block">Country</label>
                  <select className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-[13px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                    <option>Any</option>
                    <option>India</option>
                    <option>USA</option>
                    <option>UK</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[12px] font-medium text-slate-600 mb-1 block">City / Location</label>
                <input type="text" className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-[13px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="e.g. Mumbai" />
              </div>
            </div>
          )}
        </div>

        {/* 2. CATEGORY FILTERS */}
        <div className="mb-1 border-t border-slate-100 pt-1">
          <div className="px-2 py-1.5 text-[13px] font-bold text-slate-800 uppercase tracking-wide mt-2">
            2. Category Filters
          </div>
          <div className="mt-1">
            {CATEGORY_GROUPS.map((group) => (
              <div key={group.title} className="mb-1">
                <button 
                  onClick={() => toggleSection(`cat_${group.title}`)}
                  className="w-full flex items-center justify-between p-2 pl-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <span className="text-[13px] font-medium text-slate-700">{group.title}</span>
                  {openSections[`cat_${group.title}`] ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                </button>
                {openSections[`cat_${group.title}`] && (
                  <div className="pl-6 pr-2 py-1 space-y-1.5 bg-slate-50/50 rounded-b-lg border-l-2 border-indigo-100 ml-3">
                    {group.items.map((item) => (
                      <label key={item} className="flex items-start gap-2 cursor-pointer group/item">
                        <div className="relative flex items-center justify-center mt-0.5">
                          <input type="checkbox" className="peer sr-only" />
                          <div className="h-3.5 w-3.5 rounded-sm border border-slate-300 bg-white transition-colors peer-checked:border-indigo-600 peer-checked:bg-indigo-600"></div>
                        </div>
                        <span className="text-[12px] text-slate-600 group-hover/item:text-slate-900 leading-snug">{item}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 3. PERFORMANCE FILTERS */}
        <div className="mb-1 border-t border-slate-100 pt-1">
          <button 
            onClick={() => toggleSection("performance")}
            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <span className="text-[13px] font-bold text-slate-800 uppercase tracking-wide">3. Performance</span>
            {openSections["performance"] ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
          </button>
          {openSections["performance"] && (
            <div className="p-2 space-y-4">
              <div>
                <label className="text-[12px] font-medium text-slate-600 mb-1 flex justify-between">
                  <span>Followers Range</span>
                  <span className="text-indigo-600 font-bold">10k - 500k+</span>
                </label>
                <input type="range" className="w-full accent-indigo-600" />
              </div>
              <div>
                <label className="text-[12px] font-medium text-slate-600 mb-1 flex justify-between">
                  <span>Avg Views</span>
                  <span className="text-indigo-600 font-bold">5k+</span>
                </label>
                <input type="range" className="w-full accent-indigo-600" />
              </div>
              <div>
                <label className="text-[12px] font-medium text-slate-600 mb-1 flex justify-between">
                  <span>Engagement Rate</span>
                  <span className="text-indigo-600 font-bold">2%+</span>
                </label>
                <input type="range" className="w-full accent-indigo-600" />
              </div>
            </div>
          )}
        </div>

        {/* 4. BUSINESS FILTERS */}
        <div className="mb-1 border-t border-slate-100 pt-1">
          <button 
            onClick={() => toggleSection("business")}
            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <span className="text-[13px] font-bold text-slate-800 uppercase tracking-wide">4. Business</span>
            {openSections["business"] ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
          </button>
          {openSections["business"] && (
            <div className="p-2 space-y-2">
              {[
                "Has email available",
                "Has manager / agency",
                "Verified creator",
                "Brand safe",
                "Worked with brands before"
              ].map((label) => (
                <label key={label} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 h-3.5 w-3.5" />
                  <span className="text-[12px] text-slate-600">{label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
