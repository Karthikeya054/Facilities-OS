// FundFlow demo data – realistic procurement records
// Pure TypeScript, no framework dependencies.

/* ------------------------------------------------------------------ */
/*  Universities                                                       */
/* ------------------------------------------------------------------ */

export const universities = [
  { code: "NIAT-HYD", name: "NIAT Hyderabad", city: "Hyderabad", students: 4200 },
  { code: "NIAT-BLR", name: "NIAT Bangalore", city: "Bangalore", students: 3800 },
  { code: "NIAT-CHN", name: "NIAT Chennai", city: "Chennai", students: 2900 },
  { code: "NIAT-PUN", name: "NIAT Pune", city: "Pune", students: 3100 },
  { code: "NIAT-DEL", name: "NIAT Delhi", city: "New Delhi", students: 4500 },
  { code: "NIAT-KOL", name: "NIAT Kolkata", city: "Kolkata", students: 2600 },
  { code: "NIAT-MUM", name: "NIAT Mumbai", city: "Mumbai", students: 3900 },
  { code: "NIAT-AHD", name: "NIAT Ahmedabad", city: "Ahmedabad", students: 2400 },
  { code: "NIAT-JAI", name: "NIAT Jaipur", city: "Jaipur", students: 2200 },
  { code: "NIAT-LKW", name: "NIAT Lucknow", city: "Lucknow", students: 2100 },
  { code: "NIAT-IND", name: "NIAT Indore", city: "Indore", students: 1900 },
  { code: "NIAT-BHP", name: "NIAT Bhopal", city: "Bhopal", students: 1700 },
  { code: "NIAT-NGP", name: "NIAT Nagpur", city: "Nagpur", students: 1800 },
  { code: "NIAT-COI", name: "NIAT Coimbatore", city: "Coimbatore", students: 2000 },
  { code: "NIAT-KOC", name: "NIAT Kochi", city: "Kochi", students: 1600 },
  { code: "NIAT-VZG", name: "NIAT Visakhapatnam", city: "Visakhapatnam", students: 2300 },
  { code: "NIAT-VJA", name: "NIAT Vijayawada", city: "Vijayawada", students: 2100 },
  { code: "NIAT-GUW", name: "NIAT Guwahati", city: "Guwahati", students: 1400 },
  { code: "NIAT-CHD", name: "NIAT Chandigarh", city: "Chandigarh", students: 1800 },
  { code: "NIAT-DEH", name: "NIAT Dehradun", city: "Dehradun", students: 1500 },
];

/* ------------------------------------------------------------------ */
/*  Statuses & Pipeline                                                */
/* ------------------------------------------------------------------ */

export const statuses = [
  { id: "received", label: "Received", idx: 0, color: "slate" },
  { id: "vendor_search", label: "Vendor Search", idx: 1, color: "amber" },
  { id: "quoted", label: "Quoted", idx: 2, color: "amber" },
  { id: "confirmed", label: "Confirmed", idx: 3, color: "blue" },
  { id: "in_production", label: "In Production", idx: 4, color: "violet" },
  { id: "sample_ready", label: "Sample Ready", idx: 5, color: "violet" },
  { id: "in_transit", label: "In Transit", idx: 6, color: "accent" },
  { id: "delivered", label: "Delivered", idx: 7, color: "emerald" },
  { id: "completed", label: "Completed", idx: 8, color: "emerald" },
];

export const pipelineStages = [
  { id: "received", label: "Received" },
  { id: "vendor_search", label: "Vendor Search" },
  { id: "in_production", label: "In Production" },
  { id: "in_transit", label: "In Transit" },
  { id: "delivered", label: "Delivered" },
];

/* ------------------------------------------------------------------ */
/*  Staff                                                              */
/* ------------------------------------------------------------------ */

export const staff = [
  { name: "Anaya Sharma", role: "Campus Manager", initials: "AS" },
  { name: "Rohan Patel", role: "Events Lead", initials: "RP" },
  { name: "Priya Krishnan", role: "Campus Manager", initials: "PK" },
  { name: "Vikram Reddy", role: "Admin", initials: "VR" },
  { name: "Sneha Iyer", role: "Campus Manager", initials: "SI" },
  { name: "Arjun Menon", role: "Ops", initials: "AM" },
  { name: "Kavya Nair", role: "Campus Manager", initials: "KN" },
  { name: "Devansh Gupta", role: "Events Lead", initials: "DG" },
  { name: "Meera Joshi", role: "Admin", initials: "MJ" },
  { name: "Ishaan Das", role: "Campus Manager", initials: "ID" },
  { name: "Tanvi Bose", role: "Ops", initials: "TB" },
  { name: "Rahul Verma", role: "Campus Manager", initials: "RV" },
];

/* ------------------------------------------------------------------ */
/*  Vendors                                                            */
/* ------------------------------------------------------------------ */

const vendorCats = [
  "Apparel", "Print & Banners", "Trophies", "Stationery", "Tents & Staging",
  "Photography", "Courier", "Events", "AV & Production", "Merchandise",
  "Catering", "Signage", "Transport", "Fabrication",
];

const vendorNames = [
  "Aacharya Sports", "Ashish Print Co.", "Abdul Tent House", "Abhinav Studio",
  "Blueline Couriers", "Ajinkya Stationery", "Alla Press", "AM Apparel",
  "Ameya Engravers", "AMPM Travels", "Annam Trophy Works", "Annamacharya Events",
  "Apex Signage", "Arcade Studio", "Astra Fabrics", "Axis AV",
  "Banyan Trophies", "Beacon Banners", "Bharat Logistics", "Blaze Print",
  "Blue Ribbon Awards", "Bolt Courier", "Brite Signage", "Canopy Tents",
  "Capital Stationery", "Cedar Press", "Chandra Studio", "Chennai Trophy Co.",
  "Citadel Staging", "Clear Sky AV", "Cobalt Print", "Coral Catering",
  "Cosmo Apparel", "Crown Events", "Daily Logistics", "Dawn Photography",
  "Delta Fabrics", "Dharma Stationery", "Diamond Press", "Dunes Events",
  "East India Banner Co.", "Echo AV", "Elevate Signage", "Emerald Trophies",
  "Everest Tents", "Falcon Couriers", "Finesse Print", "Flame Banners",
  "Flint Apparel", "Forest Fabrics", "Fortune Events", "Frontier Logistics",
  "Garnet Awards", "Genesis Studio", "Golden Press", "Granite Fabrication",
  "Harbor Transport", "Haven Stationery", "Helix Print", "Heritage Trophies",
  "Himalaya Tents", "Horizon Signage", "Iris Photography", "Ivory Apparel",
  "Jewel Engravers", "Juniper Events", "Kavery Print", "Khadi Textiles",
  "Kinetic AV", "Kirloskar Fabrics", "Kite Banners", "Kohinoor Awards",
  "Kraft Stationery", "Lakeside Studio", "Lantern Signage", "Laurel Trophies",
  "Lumen Print", "Magnolia Events", "Maple Press", "Mercury Couriers",
  "Meridian AV", "Meteor Logistics", "Mint Apparel", "Monolith Signage",
  "Mystic Fabrics", "Nandi Awards", "Neon Banners", "Nexus Print",
  "Nimbus Tents", "Noble Stationery", "Nova Photography", "Oak Fabrication",
  "Oasis Events", "Obsidian Print", "Olympus Trophies", "Onyx Engravers",
  "Orbit Logistics", "Orion Studio", "Paragon Awards", "Peacock Textiles",
  "Phoenix AV", "Pinnacle Tents", "Prism Signage", "Quartz Press",
  "Raven Banners", "Relay Couriers", "Riverstone Events", "Sable Studio",
  "Saffron Apparel", "Sage Stationery", "Scarlet Print", "Sigma Fabrics",
  "Silverline Awards", "Solstice Events", "Spectrum AV", "Stellar Logistics",
  "Summit Signage", "Surya Photography",
];

const categoryForVendor = (i: number) => vendorCats[i % vendorCats.length];

export type Vendor = {
  id: string;
  name: string;
  category: string;
  contact: string;
  phone: string;
  email: string;
  city: string;
  rating: number;
  jobs: number;
  preferred: boolean;
};

export const vendors: Vendor[] = vendorNames.slice(0, 114).map((name, i) => ({
  id: String(i + 1).padStart(3, "0"),
  name,
  category: categoryForVendor(i),
  contact: `${name.split(" ")[0]} ${["Kumar", "Singh", "Rao", "Desai", "Shah"][i % 5]}`,
  phone: `+91 ${90000 + (i * 137) % 9999}${10000 + (i * 419) % 99999}`.slice(0, 14),
  email: `contact@${name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12)}.in`,
  city: ["Hyderabad", "Bangalore", "Chennai", "Pune", "Mumbai", "Delhi"][i % 6],
  rating: 3.5 + ((i * 7) % 15) / 10,
  jobs: 1 + (i * 3) % 48,
  preferred: i % 7 === 0,
}));

/* ------------------------------------------------------------------ */
/*  Requirements (generated deterministically)                         */
/* ------------------------------------------------------------------ */

const itemTypes = [
  "T-shirt", "Banner", "Trophy", "Stationery", "Tent",
  "ID Card", "Hoodie", "Mug", "Certificate", "Backdrop",
];

const titles = [
  "Tech Fest 2026 \u2014 Merchandise Kit",
  "Convocation Banners & Backdrops",
  "Orientation Welcome Kits",
  "Sports Day Trophy Collection",
  "Placement Drive Stationery",
  "Founder\u2019s Day T-shirts",
  "Research Symposium Standees",
  "Alumni Meet Photo Booth",
  "Cultural Week Hoodies",
  "Hackathon Swag Bundle",
  "NSS Camp Uniforms",
  "Robotics Lab Signage",
  "Annual Report Printing",
  "Library ID Card Batch",
  "Guest Lecture Podium",
  "Career Fair Booth Setup",
  "Independence Day Flags",
  "Quiz Bowl Trophy Set",
  "Freshers Welcome Banners",
  "Winter School Certificates",
  "TEDx Campus Backdrop",
  "Women\u2019s Day Merchandise",
  "Entrepreneurship Summit Kit",
  "Graduation Stoles",
];

// Deterministic pseudo-random
let seed = 7;
const rand = () => {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
};
const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const randInt = (a: number, b: number) => a + Math.floor(rand() * (b - a + 1));

const today = new Date("2026-04-18");
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const fmtDate = (d: Date) => d.toISOString().slice(0, 10);

const priorities = ["low", "medium", "high", "urgent"] as const;

export type LineItem = {
  id: string;
  type: string;
  qty: number;
  unit: number;
  total: number;
  material: string;
  sizes: Record<string, number> | null;
  dimensions: string | null;
};

export type Requirement = {
  id: string;
  title: string;
  university: (typeof universities)[number];
  requester: (typeof staff)[number];
  approver: (typeof staff)[number];
  priority: (typeof priorities)[number];
  status: (typeof statuses)[number];
  budget: number;
  quoted: number | null;
  actual: number | null;
  submittedAt: string;
  requiredBy: string;
  daysRemaining: number;
  overdue: boolean;
  items: LineItem[];
  vendor: Vendor | null;
  description: string;
  source: string;
};

export const requirements: Requirement[] = titles.map((title, i) => {
  const uni = universities[i % universities.length];
  const requester = staff[i % staff.length];
  const approver = staff[(i + 3) % staff.length];
  const priority = priorities[(i * 2 + 1) % 4];
  const statusIdx = (i * 3) % 9;
  const status = statuses[statusIdx];
  const budget = 8000 + Math.round(rand() * 240) * 1000;
  const actual = status.idx >= 6 ? budget - randInt(-5000, 8000) : null;
  const quoted = status.idx >= 2 ? budget - randInt(-3000, 4000) : null;
  const submittedDaysAgo = randInt(1, 28);
  const submittedAt = addDays(today, -submittedDaysAgo);
  const requiredBy = addDays(submittedAt, randInt(10, 35));
  const daysRemaining = Math.round(
    (requiredBy.getTime() - today.getTime()) / 86400000
  );
  const itemCount = randInt(1, 4);
  const items: LineItem[] = Array.from({ length: itemCount }, (_, k) => {
    const type = pick(itemTypes);
    const qty =
      type === "T-shirt" || type === "Hoodie"
        ? randInt(80, 400)
        : type === "Trophy"
          ? randInt(5, 30)
          : type === "Banner"
            ? randInt(2, 12)
            : randInt(20, 200);
    const unit =
      type === "T-shirt"
        ? 280
        : type === "Hoodie"
          ? 650
          : type === "Trophy"
            ? 850
            : type === "Banner"
              ? 1200
              : type === "Tent"
                ? 4500
                : 120;
    return {
      id: `${i}-${k}`,
      type,
      qty,
      unit,
      total: qty * unit,
      material:
        type === "T-shirt"
          ? "180 GSM Cotton"
          : type === "Banner"
            ? "Flex Vinyl 440 GSM"
            : "Standard",
      sizes:
        type === "T-shirt" || type === "Hoodie"
          ? {
              S: Math.round(qty * 0.15),
              M: Math.round(qty * 0.3),
              L: Math.round(qty * 0.3),
              XL: Math.round(qty * 0.2),
              XXL: Math.round(qty * 0.05),
            }
          : null,
      dimensions:
        type === "Banner"
          ? `${randInt(120, 400)} \u00d7 ${randInt(80, 200)} cm`
          : null,
    };
  });
  const vendor = status.idx >= 3 ? vendors[randInt(0, 20)] : null;

  return {
    id: `REQ-${String(1000 + i)}`,
    title,
    university: uni,
    requester,
    approver,
    priority,
    status,
    budget,
    quoted,
    actual,
    submittedAt: fmtDate(submittedAt),
    requiredBy: fmtDate(requiredBy),
    daysRemaining,
    overdue: daysRemaining < 0 && status.idx < 7,
    items,
    vendor,
    description:
      "Procurement request raised via UniConnect. Standard approval routing. All specifications confirmed by campus ops before vendor outreach.",
    source: "UniConnect",
  };
});

/* ------------------------------------------------------------------ */
/*  Aggregated stats                                                   */
/* ------------------------------------------------------------------ */

const total = requirements.length;
const active = requirements.filter((r) => r.status.idx < 7).length;
const overdue = requirements.filter((r) => r.overdue).length;
const allocated = requirements.reduce((a, r) => a + r.budget, 0);
const spent = requirements.reduce(
  (a, r) => a + (r.actual || r.quoted || 0),
  0
);
const avgDays = 14;

export const stats = { total, active, overdue, allocated, spent, avgDays };

export const byUniversity = universities
  .map((u) => ({
    ...u,
    count: requirements.filter((r) => r.university.code === u.code).length,
    value: requirements
      .filter((r) => r.university.code === u.code)
      .reduce((a, r) => a + r.budget, 0),
  }))
  .sort((a, b) => b.count - a.count);

export const byStatus = statuses.map((s) => ({
  ...s,
  count: requirements.filter((r) => r.status.id === s.id).length,
}));

/* ------------------------------------------------------------------ */
/*  Team Members, Invites & Roles                                      */
/* ------------------------------------------------------------------ */

export const TEAM_MEMBERS = [
  { id: "tm-1", name: "Anaya Sharma", email: "anaya@niat.edu", role: "Admin", avatar: null, joined: "2025-01-15" },
  { id: "tm-2", name: "Rohan Patel", email: "rohan@niat.edu", role: "Manager", avatar: null, joined: "2025-02-01" },
  { id: "tm-3", name: "Priya Krishnan", email: "priya@niat.edu", role: "Manager", avatar: null, joined: "2025-02-10" },
  { id: "tm-4", name: "Vikram Reddy", email: "vikram@niat.edu", role: "Admin", avatar: null, joined: "2025-03-05" },
  { id: "tm-5", name: "Sneha Iyer", email: "sneha@niat.edu", role: "Member", avatar: null, joined: "2025-03-18" },
  { id: "tm-6", name: "Arjun Menon", email: "arjun@niat.edu", role: "Member", avatar: null, joined: "2025-04-01" },
  { id: "tm-7", name: "Kavya Nair", email: "kavya@niat.edu", role: "Manager", avatar: null, joined: "2025-04-22" },
  { id: "tm-8", name: "Devansh Gupta", email: "devansh@niat.edu", role: "Member", avatar: null, joined: "2025-05-10" },
  { id: "tm-9", name: "Meera Joshi", email: "meera@niat.edu", role: "Admin", avatar: null, joined: "2025-06-01" },
  { id: "tm-10", name: "Ishaan Das", email: "ishaan@niat.edu", role: "Member", avatar: null, joined: "2025-07-15" },
  { id: "tm-11", name: "Tanvi Bose", email: "tanvi@niat.edu", role: "Member", avatar: null, joined: "2025-08-20" },
  { id: "tm-12", name: "Rahul Verma", email: "rahul@niat.edu", role: "Manager", avatar: null, joined: "2025-09-01" },
];

export const PENDING_INVITES = [
  { id: "inv-1", email: "neha.saxena@niat.edu", role: "Member", invited_by: "Anaya Sharma", invited_at: "2026-04-10" },
  { id: "inv-2", email: "karan.malhotra@niat.edu", role: "Manager", invited_by: "Vikram Reddy", invited_at: "2026-04-12" },
  { id: "inv-3", email: "divya.pillai@niat.edu", role: "Member", invited_by: "Priya Krishnan", invited_at: "2026-04-15" },
];

export const ROLE_DEFS = [
  { id: "owner", label: "Owner", description: "Full access. Can delete team and transfer ownership." },
  { id: "admin", label: "Admin", description: "Manage members, vendors, and all requirements." },
  { id: "manager", label: "Manager", description: "Create and manage requirements, approve purchases." },
  { id: "member", label: "Member", description: "Create requirements and view team data." },
  { id: "viewer", label: "Viewer", description: "Read-only access to team data." },
];
