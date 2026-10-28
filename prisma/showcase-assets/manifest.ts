// The showcase events' images (prisma/seed-showcase-data.ts > EVENTS): one
// Unsplash photo per banner and one designed logo per event. Plain data plus
// the slug rule, shared by:
//   - build-banners.ts   downloads and crops the photos (dev only, needs network)
//   - generate-logos.ts  renders the logos (dev only, needs Space Grotesk)
//   - ../seed-showcase-images.ts  copies the committed WebPs into UPLOAD_DIR
//
// The seed is deterministic, so the event names are stable and a slug of the
// name is the key: banners/<slug>.webp and logos/<slug>.webp.

import { createHash } from "node:crypto";

/**
 * Where an applied asset is stored under UPLOAD_DIR, in the same pattern as an
 * organizer's upload (src/lib/uploads/storage.ts): events/<id>/<kind>-<16 hex>.webp.
 * The hex comes from the file's bytes instead of randomness, so applying the
 * same asset twice gives the same path.
 */
export function showcaseImagePath(
  eventId: string,
  kind: "logo" | "banner",
  bytes: Uint8Array,
): string {
  const hex = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
  return `events/${eventId}/${kind}-${hex}.webp`;
}

/**
 * Whether a stored file was written by showcaseImagePath (from any version of
 * the assets): its name's hex is the hash of its own bytes. An organizer's
 * upload has a random hex, so it's false for those.
 */
export function isShowcaseImagePath(relative: string, bytes: Uint8Array): boolean {
  const hex = /-([0-9a-f]{16})\.webp$/.exec(relative)?.[1];
  return hex !== undefined && hex === createHash("sha256").update(bytes).digest("hex").slice(0, 16);
}

/** "Payments Weekend Bukhara" → "payments-weekend-bukhara". */
export function assetSlug(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Lucide icon names (lucide-react exports), the theme mark on each logo. */
export type LogoIcon =
  | "Accessibility" | "Activity" | "BookOpen" | "Bot" | "BrainCircuit"
  | "Bug" | "Building2" | "Castle" | "CircuitBoard" | "CodeXml" | "Coins"
  | "Compass" | "Cpu" | "CreditCard" | "Dices" | "Droplets" | "FileCheck"
  | "Flag" | "Gamepad2" | "GraduationCap" | "HandHeart" | "HeartHandshake"
  | "HeartPulse" | "Hourglass" | "HouseWifi" | "Joystick" | "KeyRound"
  | "Landmark" | "Languages" | "Leaf" | "Map" | "MapPin" | "Rocket"
  | "ScanEye" | "School" | "Shield" | "ShoppingBag" | "Smartphone"
  | "Sparkles" | "Store" | "Sun" | "Swords" | "Tractor" | "TrainFront"
  | "Truck" | "Users" | "Wallet" | "Waves" | "Wheat" | "Wind" | "Route";

export type ShowcaseAsset = {
  /** The event name exactly as in seed-showcase-data.ts. */
  name: string;
  logo: {
    /** 2–3 characters on the tile. */
    monogram: string;
    icon: LogoIcon;
    /**
     * Index into generate-logos.ts > STYLES. The 10 events of each organizer
     * use 10 different styles, so their lists don't look alike.
     */
    style: number;
  };
  banner: {
    /** The images.unsplash.com id ("photo-<id>"). */
    photo: string;
    /** The photo's page on unsplash.com (the license is shown there). */
    page: string;
    photographer: string;
    /**
     * Where the 1600×600 crop sits in the cover-scaled photo: 0 = left/top,
     * 0.5 = centre, 1 = right/bottom. The UI crops the banner further on
     * phones (2:1, centred), so the subject stays near the middle.
     */
    focus?: { x?: number; y?: number };
  };
};

const page = (id: string) => `https://unsplash.com/photos/${id}`;

// Grouped by organizer in the seeded data (10 each), so the styles 0–9 can be
// spread per organizer. Every photo is "Free to use under the Unsplash
// License" (checked on its page; none is Unsplash+).
export const SHOWCASE_ASSETS: ShowcaseAsset[] = [
  // Anvar Jalilov
  { name: "Uzbek Language AI Hackathon", logo: { monogram: "UZ", icon: "Languages", style: 0 }, banner: { photo: "1485827404703-89b55fcc595e", page: page("2EJCSULRwC8"), photographer: "Alex Knight", focus: { y: 0.3 } } },
  { name: "Silk Road Indie Game Jam", logo: { monogram: "SR", icon: "Swords", style: 1 }, banner: { photo: "1772235231771-f17980e811e4", page: page("xeCywSyt8Zc"), photographer: "Abdullahi Mohamud" } },
  { name: "Women in Tech Hackathon", logo: { monogram: "WiT", icon: "Rocket", style: 2 }, banner: { photo: "1531535701800-03b2bec4fbfd", page: page("GXEcTqlZHno"), photographer: "Mimi Thian", focus: { y: 0.15 } } },
  { name: "Payments Weekend Bukhara", logo: { monogram: "PW", icon: "Wallet", style: 3 }, banner: { photo: "1673446840855-1c82bafdb67d", page: page("e2uaQCdKOFw"), photographer: "Evgeny Matveev" } },
  { name: "Student Security Cup", logo: { monogram: "SSC", icon: "KeyRound", style: 4 }, banner: { photo: "1629904853893-c2c8981a1dc5", page: page("Im_cQ6hQo10"), photographer: "Compagnons" } },
  { name: "Last Mile Logistics Challenge", logo: { monogram: "LM", icon: "Truck", style: 5 }, banner: { photo: "1617347454431-f49d7ff5c3b1", page: page("clYlmCaQbzY"), photographer: "Rowan Freeman" } },
  { name: "FinTech Sprint Samarkand", logo: { monogram: "FS", icon: "CreditCard", style: 6 }, banner: { photo: "1787472259744-be2c02928b87", page: page("dtDTZnWIfH4"), photographer: "Hao Wu" } },
  { name: "Metro and Bus Data Jam", logo: { monogram: "MB", icon: "TrainFront", style: 7 }, banner: { photo: "1659469688035-d4381fd67b8f", page: page("4mNTT9Suck8"), photographer: "Salohiddin Kamolov" } },
  { name: "Classroom of Tomorrow", logo: { monogram: "CT", icon: "School", style: 8 }, banner: { photo: "1509062522246-3755977927d7", page: page("zFSo6bnZJTw"), photographer: "Quilia" } },
  { name: "Green Bukhara Hack", logo: { monogram: "GB", icon: "Leaf", style: 9 }, banner: { photo: "1603221197221-e9b151b5c83e", page: page("8DNT35WI090"), photographer: "Abdy Ta" } },

  // Bahodir Rahimov
  { name: "Tashkent Mobility Hack", logo: { monogram: "TM", icon: "Route", style: 3 }, banner: { photo: "1552650302-9d5005723088", page: page("nqdg17euDUQ"), photographer: "Safar Safarov" } },
  { name: "Bukhara CTF Night", logo: { monogram: "BN", icon: "Bug", style: 4 }, banner: { photo: "1791436446233-4c2e4577943a", page: page("HVNlfgV9Gqs"), photographer: "Bernd Dittrich" } },
  { name: "Microfinance for Mahallas", logo: { monogram: "MF", icon: "Coins", style: 5 }, banner: { photo: "1743414254935-4c374bfacb2c", page: page("cXpgjQeKfdQ"), photographer: "Dasha Novikova" } },
  { name: "Farm to Market Hackathon", logo: { monogram: "FM", icon: "Wheat", style: 6 }, banner: { photo: "1743414249042-f42a264aebd6", page: page("OF1wKlB--OU"), photographer: "Dasha Novikova" } },
  { name: "Public Services UX Jam", logo: { monogram: "UX", icon: "FileCheck", style: 7 }, banner: { photo: "1681949287382-052ea3954a51", page: page("KHpjeuaWOec"), photographer: "Sable Flow" } },
  { name: "Climate Action Hack", logo: { monogram: "CA", icon: "Wind", style: 8 }, banner: { photo: "1466611653911-95081537e5b7", page: page("0w-uTa0Xz7w"), photographer: "Karsten Würth" } },
  { name: "Learn to Code Jam", logo: { monogram: "LC", icon: "CodeXml", style: 9 }, banner: { photo: "1653566031471-85365f8d0ae0", page: page("gHaWLerZXBg"), photographer: "UK Black Tech", focus: { y: 0.2 } } },
  { name: "Capture the Flag Tashkent", logo: { monogram: "CTF", icon: "Flag", style: 0 }, banner: { photo: "1760199789455-49098afd02f0", page: page("hLAmfdxGlls"), photographer: "Julio Lopez" } },
  { name: "Clean Energy Weekend", logo: { monogram: "CE", icon: "Sun", style: 1 }, banner: { photo: "1509391366360-2e959784a276", page: page("513dBrMJ_5w"), photographer: "American Public Power Association" } },
  { name: "Samarkand Game Jam", logo: { monogram: "SGJ", icon: "Joystick", style: 2 }, banner: { photo: "1664602078796-68ee76b3fc59", page: page("hvLu3ABC1n0"), photographer: "Ozodbek Erkinov" } },

  // Farrukh Obidov
  { name: "GovTech Challenge Tashkent", logo: { monogram: "GT", icon: "Building2", style: 6 }, banner: { photo: "1622021109028-8ba1d5374161", page: page("hDO53B4wFWU"), photographer: "Far Chinberdiev" } },
  { name: "Mobile Games Weekend", logo: { monogram: "MG", icon: "Smartphone", style: 7 }, banner: { photo: "1784969293884-8d3afcff1a13", page: page("3Z-rn9SCaQM"), photographer: "Amanz" } },
  { name: "Samarkand EdTech Weekend", logo: { monogram: "SE", icon: "BookOpen", style: 8 }, banner: { photo: "1561089489-f13d5e730d72", page: page("Z-fq3wBVfMU"), photographer: "Shubham Sharan" } },
  { name: "Digital Mahalla Hackathon", logo: { monogram: "DM", icon: "Users", style: 9 }, banner: { photo: "1680789337218-aea1b03ccc41", page: page("eK7Q7phvASI"), photographer: "Sarvar Samigov" } },
  { name: "Aral Sea Data Challenge", logo: { monogram: "AS", icon: "Waves", style: 0 }, banner: { photo: "1606771090633-66bf56fb13fb", page: page("uQNIhOT-WBA"), photographer: "Artem Asset", focus: { y: 0.15 } } },
  { name: "AgriTech Hack Samarkand", logo: { monogram: "AG", icon: "Tractor", style: 1 }, banner: { photo: "1717702576954-c07131c54169", page: page("_dnc3j1oVlk"), photographer: "Tom De Decker" } },
  { name: "Samarkand Smart Tourism", logo: { monogram: "SST", icon: "Compass", style: 2 }, banner: { photo: "1733586092622-1b3201e802a5", page: page("JRpE5XBwlg0"), photographer: "Hans-Jürgen Weinhardt" } },
  { name: "Bozor E-commerce Hack", logo: { monogram: "BZ", icon: "ShoppingBag", style: 3 }, banner: { photo: "1743416982500-cd1f71ad7bb1", page: page("BRbdYUUhOlI"), photographer: "Dasha Novikova" } },
  { name: "Clinic Queue Challenge", logo: { monogram: "CQ", icon: "Hourglass", style: 4 }, banner: { photo: "1495658013006-a2069f54d3d7", page: page("qvFlxrDSyXU"), photographer: "Andrik Langfield" } },
  { name: "Registan Labs ML Sprint", logo: { monogram: "RL", icon: "BrainCircuit", style: 5 }, banner: { photo: "1719144065955-89a4dadaba41", page: page("IFlbZJgP2S8"), photographer: "Alessio Roversi" } },

  // Maksim Khan
  { name: "Accessibility Hack", logo: { monogram: "AX", icon: "Accessibility", style: 9 }, banner: { photo: "1764006145420-df3006edf060", page: page("XjoI1OjweWo"), photographer: "Jose Manuel Esp" } },
  { name: "Social Impact Hackathon", logo: { monogram: "SI", icon: "HeartHandshake", style: 0 }, banner: { photo: "1652971876875-05db98fab376", page: page("CxL29J-aM5E"), photographer: "Joe Whalen" } },
  { name: "Heritage Tech Jam Bukhara", logo: { monogram: "HJ", icon: "Castle", style: 1 }, banner: { photo: "1694782540764-7dd31798823f", page: page("dVpjB9kZMKM"), photographer: "Max Tcvetkov" } },
  { name: "Small Business Digital Week", logo: { monogram: "SB", icon: "Store", style: 2 }, banner: { photo: "1770013413878-2530e2c3d82b", page: page("k63Or81F8-M"), photographer: "Rifki Kurniawan", focus: { y: 0.25 } } },
  { name: "Smart Home Challenge", logo: { monogram: "SH", icon: "HouseWifi", style: 3 }, banner: { photo: "1757524492552-d47a66a2b63e", page: page("cUoXTLVFQ9M"), photographer: "Michael Brown" } },
  { name: "Bukhara Smart City Challenge", logo: { monogram: "BSC", icon: "MapPin", style: 4 }, banner: { photo: "1670514535515-e7af911bdadb", page: page("2_wymUghgr8"), photographer: "Evgeny Matveev" } },
  { name: "Computer Vision Cup", logo: { monogram: "CV", icon: "ScanEye", style: 5 }, banner: { photo: "1786539861520-6e91dc64a958", page: page("66VbdwUpmA8"), photographer: "Enchanted Tools" } },
  { name: "IoT Makers Weekend", logo: { monogram: "IoT", icon: "Cpu", style: 6 }, banner: { photo: "1555664424-778a1e5e1b48", page: page("zP7X_B86xOg"), photographer: "Robin Glauser" } },
  { name: "Silk Road Tourism Hackathon", logo: { monogram: "SRT", icon: "Map", style: 7 }, banner: { photo: "1787472259709-faa92e5b3d69", page: page("eUNQAwfKi3Y"), photographer: "Hao Wu" } },
  { name: "Cyber Shield CTF", logo: { monogram: "CS", icon: "Shield", style: 8 }, banner: { photo: "1614064641938-3bbee52942c7", page: page("mT7lXZPjk7U"), photographer: "FlyD" } },

  // Nigora Muminova
  { name: "Bukhara Health Data Weekend", logo: { monogram: "BHD", icon: "Activity", style: 2 }, banner: { photo: "1653023102302-247f5f0fbdd1", page: page("v9ZBig1I_j4"), photographer: "Sultonbek Ikromov" } },
  { name: "Tashkent Game Jam", logo: { monogram: "TGJ", icon: "Gamepad2", style: 3 }, banner: { photo: "1558008258-7ff8888b42b0", page: page("ryRU-cd1yas"), photographer: "Stem List" } },
  { name: "Tashkent AI Weekend", logo: { monogram: "TAI", icon: "Sparkles", style: 4 }, banner: { photo: "1648731009796-1b37953dd8c5", page: page("t6UpMUYPJwk"), photographer: "Sultonbek Ikromov" } },
  { name: "Student Wellbeing Hack", logo: { monogram: "SW", icon: "HandHeart", style: 5 }, banner: { photo: "1745558852855-9f9e34017226", page: page("ogHP2WE0Okc"), photographer: "Veronica Dudarev" } },
  { name: "Smart Irrigation Challenge", logo: { monogram: "IR", icon: "Droplets", style: 6 }, banner: { photo: "1692369584496-3216a88f94c1", page: page("6DMht7wYt6g"), photographer: "Lumin Osity" } },
  { name: "Hardware Hack Samarkand", logo: { monogram: "HW", icon: "CircuitBoard", style: 7 }, banner: { photo: "1649959265391-8a1de884248a", page: page("0iRfjG7IGeo"), photographer: "Vishnu Mohanan" } },
  { name: "Generative AI for Business", logo: { monogram: "GAI", icon: "Bot", style: 8 }, banner: { photo: "1542744173-8e7e53415bb0", page: page("gMsnXqILjp4"), photographer: "Campaign Creators" } },
  { name: "Open Banking Hack", logo: { monogram: "OB", icon: "Landmark", style: 9 }, banner: { photo: "1628527304948-06157ee3c8a6", page: page("HNPrWOH2Z8U"), photographer: "Towfiqu barbhuiya", focus: { y: 0.3 } } },
  { name: "EdTech Build Week", logo: { monogram: "EB", icon: "GraduationCap", style: 0 }, banner: { photo: "1758270705290-62b6294dd044", page: page("kp7qkHTgSKc"), photographer: "Vitaly Gariev", focus: { y: 0.3 } } },
  { name: "HealthTech Hackathon Tashkent", logo: { monogram: "HT", icon: "HeartPulse", style: 1 }, banner: { photo: "1758691462878-6edc3d3da1be", page: page("iyeUwItlIPk"), photographer: "Vitaly Gariev" } },
];
