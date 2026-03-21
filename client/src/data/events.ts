export type EventCategory = "Concert" | "Theatre" | "Comedy" | "Sports" | "Festival" | "Movie";
export type EventType = "movie" | "sports" | "event";

export interface PriceCategory {
  id: string;
  label: string;
  price: number;
  color: string;
}

export interface EventData {
  id: string;
  title: string;
  image: string;
  rating: number;
  description: string;
  location: string;
  venue: string;
  date: string;
  time: string;
  category: EventCategory;
  featured: boolean;
  price: number;
  duration: string;
  language: string;
  tags: string[];
  totalSeats: number;
  type: EventType;
  priceCategories: PriceCategory[];
}

export const EVENTS: EventData[] = [
  {
    id: "ev-001",
    title: "Aurora Nights Live",
    image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&h=675&fit=crop",
    rating: 4.8,
    description:
      "Experience an unforgettable evening with Aurora Nights — a landmark electronic live concert featuring pulsating beats, immersive laser-light shows, and visuals projected across a massive 180° screen.",
    location: "Bengaluru, Karnataka",
    venue: "Skyline Arena, Outer Ring Road",
    date: "2026-04-12",
    time: "7:30 PM",
    category: "Concert",
    featured: true,
    price: 999,
    duration: "3 hrs",
    language: "Instrumental",
    tags: ["Live Music", "Electronic", "Lights"],
    totalSeats: 40,
    type: "event",
    priceCategories: [
      { id: "general",  label: "General",  price: 999,  color: "#22C55E" },
      { id: "vip",      label: "VIP",      price: 1999, color: "#8B5CF6" },
      { id: "premium",  label: "Premium",  price: 4999, color: "#F59E0B" },
    ],
  },
  {
    id: "ev-002",
    title: "Hamlet Reimagined",
    image: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=1200&h=675&fit=crop",
    rating: 4.6,
    description:
      "A bold modern adaptation of Shakespeare's Hamlet set in a dystopian corporate future. Critically acclaimed direction with a stellar cast, stunning scenic design, and a haunting original score.",
    location: "Mumbai, Maharashtra",
    venue: "Grand Stage Theatre, Bandra",
    date: "2026-04-15",
    time: "6:30 PM",
    category: "Theatre",
    featured: true,
    price: 499,
    duration: "2 hrs 30 min",
    language: "English",
    tags: ["Drama", "Shakespeare", "Classic"],
    totalSeats: 32,
    type: "event",
    priceCategories: [
      { id: "general",  label: "General",  price: 499,  color: "#22C55E" },
      { id: "vip",      label: "VIP",      price: 999,  color: "#8B5CF6" },
      { id: "premium",  label: "Premium",  price: 1999, color: "#F59E0B" },
    ],
  },
  {
    id: "ev-003",
    title: "Laugh Factory Night",
    image: "https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=1200&h=675&fit=crop",
    rating: 4.5,
    description:
      "India's biggest stand-up special returns! An evening of non-stop laughter featuring the country's top comedians — raw, relatable, and ridiculously funny.",
    location: "New Delhi",
    venue: "Downtown Studio, Connaught Place",
    date: "2026-04-16",
    time: "9:00 PM",
    category: "Comedy",
    featured: false,
    price: 499,
    duration: "2 hrs",
    language: "Hindi / English",
    tags: ["Stand-up", "Comedy", "Live"],
    totalSeats: 48,
    type: "event",
    priceCategories: [
      { id: "general", label: "General", price: 499, color: "#22C55E" },
      { id: "vip",     label: "VIP",     price: 999, color: "#8B5CF6" },
    ],
  },
  {
    id: "ev-004",
    title: "City Derby Finals",
    image: "https://images.unsplash.com/photo-1540747913346-19212a4b423b?w=1200&h=675&fit=crop",
    rating: 4.7,
    description:
      "The season's most anticipated showdown is here. Witness the fierce rivalry between the city's top two teams in a packed stadium atmosphere.",
    location: "Chennai, Tamil Nadu",
    venue: "National Sports Dome, Anna Salai",
    date: "2026-04-19",
    time: "5:00 PM",
    category: "Sports",
    featured: true,
    price: 599,
    duration: "3 hrs",
    language: "N/A",
    tags: ["Sports", "Derby", "Live Action"],
    totalSeats: 80,
    type: "sports",
    priceCategories: [
      { id: "budget",   label: "General Stand", price: 599,  color: "#22C55E" },
      { id: "standard", label: "Standard",      price: 1199, color: "#3B82F6" },
      { id: "premium",  label: "Premium",       price: 2499, color: "#8B5CF6" },
      { id: "vip",      label: "VIP Box",       price: 4999, color: "#F59E0B" },
    ],
  },
  {
    id: "ev-005",
    title: "Sunburn Horizons Festival",
    image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&h=675&fit=crop",
    rating: 4.9,
    description:
      "Asia's biggest music festival returns to the coast for its milestone 15th edition! Three days of headlining international DJs, art installations, and gourmet food experiences.",
    location: "Goa",
    venue: "Vagator Beach Grounds",
    date: "2026-04-24",
    time: "4:00 PM",
    category: "Festival",
    featured: true,
    price: 2999,
    duration: "3 Days",
    language: "International",
    tags: ["EDM", "Festival", "Outdoor", "Goa"],
    totalSeats: 100,
    type: "event",
    priceCategories: [
      { id: "general", label: "General",  price: 2999, color: "#22C55E" },
      { id: "vip",     label: "VIP Pass", price: 5999, color: "#8B5CF6" },
      { id: "premium", label: "Premium",  price: 9999, color: "#F59E0B" },
    ],
  },
  {
    id: "ev-006",
    title: "The Strings Quartet",
    image: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1200&h=675&fit=crop",
    rating: 4.4,
    description:
      "An intimate evening of classical and neo-classical music featuring one of India's most celebrated string quartets.",
    location: "Pune, Maharashtra",
    venue: "Aga Khan Palace Amphitheatre",
    date: "2026-04-20",
    time: "6:00 PM",
    category: "Concert",
    featured: false,
    price: 599,
    duration: "2 hrs",
    language: "Instrumental",
    tags: ["Classical", "Strings", "Intimate"],
    totalSeats: 32,
    type: "event",
    priceCategories: [
      { id: "general", label: "General", price: 599,  color: "#22C55E" },
      { id: "premium", label: "Premium", price: 1199, color: "#F59E0B" },
    ],
  },
  {
    id: "ev-007",
    title: "Mumbai Comedy Collective",
    image: "https://images.unsplash.com/photo-1586105251261-72a756497a11?w=1200&h=675&fit=crop",
    rating: 4.3,
    description:
      "Six of Mumbai's finest comedians take the stage in an evening of unfiltered, unpredictable humour.",
    location: "Mumbai, Maharashtra",
    venue: "Canvas Laugh Club, Lower Parel",
    date: "2026-04-22",
    time: "8:00 PM",
    category: "Comedy",
    featured: false,
    price: 399,
    duration: "2 hrs",
    language: "Hindi / English",
    tags: ["Comedy", "Stand-up", "Mumbai"],
    totalSeats: 48,
    type: "event",
    priceCategories: [
      { id: "general", label: "General", price: 399, color: "#22C55E" },
      { id: "vip",     label: "VIP",     price: 699, color: "#8B5CF6" },
    ],
  },
  {
    id: "ev-008",
    title: "IPL Night Thriller",
    image: "https://images.unsplash.com/photo-1521731978332-9e9e714bdd16?w=1200&h=675&fit=crop",
    rating: 4.6,
    description:
      "Watch the IPL season's most anticipated fixture live at the stadium. Cheer for your favourite team amidst thousands of passionate fans.",
    location: "Hyderabad, Telangana",
    venue: "Rajiv Gandhi International Stadium",
    date: "2026-04-25",
    time: "7:30 PM",
    category: "Sports",
    featured: false,
    price: 1199,
    duration: "4 hrs",
    language: "N/A",
    tags: ["Cricket", "IPL", "Sports"],
    totalSeats: 100,
    type: "sports",
    priceCategories: [
      { id: "budget",   label: "General Stand", price: 1199, color: "#22C55E" },
      { id: "standard", label: "Standard",      price: 2499, color: "#3B82F6" },
      { id: "premium",  label: "Premium",       price: 4999, color: "#8B5CF6" },
      { id: "vip",      label: "VIP Box",       price: 9999, color: "#F59E0B" },
    ],
  },
  {
    id: "ev-009",
    title: "Inception: Director's Cut",
    image: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1200&h=675&fit=crop",
    rating: 4.9,
    description:
      "Christopher Nolan's mind-bending masterpiece returns to the big screen in a stunning 4K restoration. Witness the layers of dreams unfold like never before in IMAX.",
    location: "Bengaluru, Karnataka",
    venue: "PVR IMAX, Phoenix Marketcity",
    date: "2026-04-14",
    time: "6:45 PM",
    category: "Movie",
    featured: true,
    price: 200,
    duration: "2 hrs 28 min",
    language: "English",
    tags: ["Sci-Fi", "Thriller", "IMAX", "Nolan"],
    totalSeats: 168,
    type: "movie",
    priceCategories: [
      { id: "classic",    label: "Classic",    price: 200, color: "#64748B" },
      { id: "prime",      label: "Prime",      price: 350, color: "#3B82F6" },
      { id: "prime_plus", label: "Prime Plus", price: 500, color: "#8B5CF6" },
      { id: "recliner",   label: "Recliner",   price: 800, color: "#F59E0B" },
    ],
  },
  {
    id: "ev-010",
    title: "Pathaan 2: Rise",
    image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&h=675&fit=crop",
    rating: 4.2,
    description:
      "The legendary RAW agent is back — bigger, bolder, and more explosive. Pathaan returns to save the nation in this action-packed sequel packed with high-octane sequences.",
    location: "Mumbai, Maharashtra",
    venue: "Cinepolis, Oberoi Mall",
    date: "2026-04-17",
    time: "8:30 PM",
    category: "Movie",
    featured: false,
    price: 250,
    duration: "2 hrs 45 min",
    language: "Hindi",
    tags: ["Action", "Bollywood", "Spy"],
    totalSeats: 168,
    type: "movie",
    priceCategories: [
      { id: "classic",    label: "Classic",    price: 250, color: "#64748B" },
      { id: "prime",      label: "Prime",      price: 450, color: "#3B82F6" },
      { id: "prime_plus", label: "Prime Plus", price: 600, color: "#8B5CF6" },
      { id: "recliner",   label: "Recliner",   price: 950, color: "#F59E0B" },
    ],
  },
];
