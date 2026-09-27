const EARTH_KM = 6371;
export const NEARBY_KM = 100;

const ALIAS: Record<string, string> = {
  bangalore: "bengaluru",
  mysore: "mysuru",
  bombay: "mumbai",
  calcutta: "kolkata",
  madras: "chennai",
  poona: "pune",
  trivandrum: "thiruvananthapuram",
  baroda: "vadodara",
  benares: "varanasi",
  kashi: "varanasi",
  gurgaon: "gurugram",
  simla: "shimla",
  trichy: "tiruchirappalli",
  tumkur: "tumakuru",
  belgaum: "belagavi",
  hubli: "hubballi",
  mangalore: "mangaluru",
  trichur: "thrissur",
  calicut: "kozhikode",
  alleppey: "alappuzha",
  quilon: "kollam",
  vizag: "visakhapatnam",
  waltair: "visakhapatnam",
  allahabad: "prayagraj",
};

/** Major Indian cities — enough to judge a 100 km ring around the member. */
const CITY_COORDS: Record<string, readonly [number, number]> = {
  mumbai: [19.076, 72.8777],
  delhi: [28.6139, 77.209],
  "new delhi": [28.6139, 77.209],
  bengaluru: [12.9716, 77.5946],
  hyderabad: [17.385, 78.4867],
  ahmedabad: [23.0225, 72.5714],
  chennai: [13.0827, 80.2707],
  kolkata: [22.5726, 88.3639],
  pune: [18.5204, 73.8567],
  jaipur: [26.9124, 75.7873],
  surat: [21.1702, 72.8311],
  lucknow: [26.8467, 80.9462],
  kanpur: [26.4499, 80.3319],
  nagpur: [21.1458, 79.0882],
  indore: [22.7196, 75.8577],
  thane: [19.2183, 72.9781],
  bhopal: [23.2599, 77.4126],
  visakhapatnam: [17.6868, 83.2185],
  patna: [25.5941, 85.1376],
  vadodara: [22.3072, 73.1812],
  ghaziabad: [28.6692, 77.4538],
  ludhiana: [30.901, 75.8573],
  agra: [27.1767, 78.0081],
  nashik: [19.9975, 73.7898],
  faridabad: [28.4089, 77.3178],
  meerut: [28.9845, 77.7064],
  rajkot: [22.3039, 70.8022],
  varanasi: [25.3176, 82.9739],
  srinagar: [34.0837, 74.7973],
  amritsar: [31.634, 74.8723],
  chandigarh: [30.7333, 76.7794],
  ranchi: [23.3441, 85.3096],
  raipur: [21.2514, 81.6296],
  coimbatore: [11.0168, 76.9558],
  jamshedpur: [22.8046, 86.2029],
  madurai: [9.9252, 78.1198],
  kochi: [9.9312, 76.2673],
  gurugram: [28.4595, 77.0266],
  noida: [28.5355, 77.391],
  "greater noida": [28.4744, 77.504],
  mysuru: [12.2958, 76.6394],
  mangaluru: [12.9141, 74.856],
  hubballi: [15.3647, 75.124],
  belagavi: [15.8497, 74.4977],
  tumakuru: [13.3379, 77.1173],
  davangere: [14.4663, 75.926],
  shivamogga: [13.9299, 75.5681],
  ballari: [15.1394, 76.9214],
  kalaburagi: [17.3297, 76.8343],
  vijayapura: [16.8302, 75.71],
  udupi: [13.3409, 74.7421],
  hassan: [13.0033, 76.1004],
  mandya: [12.5223, 76.9009],
  chikkamagaluru: [13.3161, 75.772],
  hosur: [12.7409, 77.8253],
  kolar: [13.1367, 78.1291],
  chitradurga: [14.2251, 76.398],
  raichur: [16.2076, 77.3463],
  bidar: [17.9133, 77.5301],
  thiruvananthapuram: [8.5241, 76.9366],
  kozhikode: [11.2588, 75.7804],
  thrissur: [10.5276, 76.2144],
  kannur: [11.8745, 75.3704],
  kollam: [8.8932, 76.6141],
  alappuzha: [9.4981, 76.3388],
  palakkad: [10.7867, 76.6548],
  salem: [11.6643, 78.146],
  erode: [11.341, 77.7172],
  tiruppur: [11.1085, 77.3411],
  vellore: [12.9165, 79.1325],
  tiruchirappalli: [10.7905, 78.7047],
  thanjavur: [10.787, 79.1378],
  puducherry: [11.9416, 79.8083],
  vijayawada: [16.5062, 80.648],
  guntur: [16.3067, 80.4365],
  tirupati: [13.6288, 79.4192],
  nellore: [14.4426, 79.9865],
  warangal: [17.9689, 79.5941],
  nizamabad: [18.6725, 78.0941],
  aurangabad: [19.8762, 75.3433],
  "navi mumbai": [19.033, 73.0297],
  kalyan: [19.2403, 73.1305],
  vasai: [19.3919, 72.8397],
  panvel: [18.9894, 73.1175],
  kolhapur: [16.705, 74.2433],
  sangli: [16.8524, 74.5815],
  solapur: [17.6599, 75.9064],
  panaji: [15.4909, 73.8278],
  goa: [15.4909, 73.8278],
  margao: [15.2832, 73.9862],
  bhubaneswar: [20.2961, 85.8245],
  cuttack: [20.4625, 85.883],
  guwahati: [26.1445, 91.7362],
  imphal: [24.817, 93.9368],
  shillong: [25.5788, 91.8933],
  agartala: [23.8315, 91.2868],
  aizawl: [23.7271, 92.7176],
  kohima: [25.6751, 94.1086],
  itanagar: [27.0844, 93.6053],
  gangtok: [27.3389, 88.6065],
  shimla: [31.1048, 77.1734],
  dehradun: [30.3165, 78.0322],
  haridwar: [29.9457, 78.1642],
  jammu: [32.7266, 74.857],
  jalandhar: [31.326, 75.5762],
  patiala: [30.3398, 76.3869],
  mohali: [30.7046, 76.7179],
  panchkula: [30.6942, 76.8606],
  hisar: [29.1492, 75.7217],
  karnal: [29.6857, 76.9905],
  panipat: [29.3909, 76.9635],
  rohtak: [28.8955, 76.6066],
  ajmer: [26.4499, 74.6399],
  udaipur: [24.5854, 73.7125],
  jodhpur: [26.2389, 73.0243],
  kota: [25.2138, 75.8648],
  bikaner: [28.0229, 73.3119],
  gwalior: [26.2183, 78.1828],
  jabalpur: [23.1815, 79.9864],
  ujjain: [23.1765, 75.7885],
  bilaspur: [22.0797, 82.1391],
  durg: [21.1904, 81.2849],
  bhilai: [21.1938, 81.3509],
  dhanbad: [23.7957, 86.4304],
  bokaro: [23.6693, 86.1511],
  gaya: [24.7914, 85.0002],
  muzaffarpur: [26.1209, 85.3647],
  bhagalpur: [25.2425, 86.9842],
  prayagraj: [25.4358, 81.8463],
  bhavnagar: [21.7645, 72.1519],
  jamnagar: [22.4707, 70.0577],
  gandhinagar: [23.2156, 72.6369],
};

function rad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function normalizePlace(value?: string | null): string {
  const raw = (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  return ALIAS[raw] ?? raw;
}

function coordsFor(city?: string | null): readonly [number, number] | null {
  const key = normalizePlace(city);
  return key ? (CITY_COORDS[key] ?? null) : null;
}

export function kmApart(
  from: { city?: string | null; state?: string | null },
  to: { city?: string | null; state?: string | null },
): number | null {
  const a = normalizePlace(from.city);
  const b = normalizePlace(to.city);
  if (!a || !b) return null;
  if (a === b) return 0;
  const here = coordsFor(a);
  const there = coordsFor(b);
  if (!here || !there) return null;
  const dLat = rad(there[0] - here[0]);
  const dLng = rad(there[1] - here[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(here[0])) * Math.cos(rad(there[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function isWithinKm(
  from: { city?: string | null; state?: string | null },
  to: { city?: string | null; state?: string | null },
  km = NEARBY_KM,
): boolean {
  const dist = kmApart(from, to);
  return dist != null && dist <= km;
}

export function nearbyLabel(km: number): string {
  if (km < 1) return "Same city";
  return `${Math.round(km)} km`;
}

export function sameCommunity(a?: string | null, b?: string | null): boolean {
  const left = (a ?? "").trim().toLowerCase();
  const right = (b ?? "").trim().toLowerCase();
  return Boolean(left && right && left === right);
}
