import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SyntheticProfile, FullExportData } from './types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const demoDir = path.join(rootDir, 'synthetic_profiles');

if (!fs.existsSync(demoDir)) {
  fs.mkdirSync(demoDir, { recursive: true });
}

const MOROCCAN_FIRST_NAMES = ['Amine', 'Yasmine', 'Karim', 'Salma', 'Omar', 'Fatima Zohra', 'Mehdi', 'Zineb', 'Hamza', 'Imane', 'Taha', 'Khadija'];
const MOROCCAN_LAST_NAMES = ['El Fassi', 'Berrada', 'Tazi', 'Bennani', 'Chraibi', 'Alami', 'Idrissi', 'Benjelloun', 'Slaoui', 'Kabbaj', 'Lahlou', 'Bouanani'];
const MOROCCAN_CITIES = ['Casablanca (Maârif)', 'Rabat (Agdal)', 'Marrakech (Guéliz)', 'Tanger (Malabata)', 'Agadir (Founty)', 'Fès (Ville Nouvelle)'];

const WORKPLACES = [
  'Technopark Casablanca / Fintech Lab',
  'OCP Innovation Center Benguerir',
  'Attijariwafa Tower - CFC Casa Finance City',
  'Maroc Telecom Data Hub Rabat',
  'Alstom Transport Tanger Med',
  'Université Mohammed VI Polytechnique (UM6P)',
];

// Helper to generate a neutral SVG screenshot representing a mobile social profile card
function generateProfileCardSvg(name: string, username: string, city: string, bio: string, tier: string): string {
  const accentColor = tier === 'critical' ? '#D9482B' : tier === 'high' ? '#C98A1B' : tier === 'medium' ? '#2F7D5B' : '#4F46E5';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750" width="600" height="750" style="background:#FAF8F5;font-family:'Manrope',sans-serif;">
  <defs>
    <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.06"/>
    </filter>
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E8E4DD"/>
      <stop offset="100%" stop-color="#D5CEBE"/>
    </linearGradient>
  </defs>

  <!-- Phone frame wrapper -->
  <rect x="20" y="20" width="560" height="710" rx="32" fill="#FFFFFF" filter="url(#cardShadow)" stroke="#E5E0D8" stroke-width="2"/>
  
  <!-- Status bar -->
  <text x="50" y="55" font-size="14" font-weight="600" fill="#16181D">09:41</text>
  <circle cx="530" cy="50" r="4" fill="#16181D"/>
  <rect x="540" y="44" width="18" height="11" rx="3" fill="none" stroke="#16181D" stroke-width="1.5"/>

  <!-- Top bar -->
  <text x="50" y="100" font-size="20" font-weight="700" fill="#16181D">@${username}</text>
  <rect x="440" y="82" width="100" height="28" rx="14" fill="#F0ECE1"/>
  <text x="490" y="101" font-size="12" font-weight="600" fill="#666053" text-anchor="middle">Profile Card</text>

  <!-- Banner -->
  <rect x="40" y="125" width="520" height="130" rx="18" fill="url(#headerGrad)"/>
  <text x="60" y="225" font-size="14" font-weight="500" fill="#756F62">📍 ${city}</text>

  <!-- Avatar circle (stylized monogram, not real photo) -->
  <circle cx="105" cy="275" r="45" fill="#FFFFFF" stroke="#E5E0D8" stroke-width="3"/>
  <circle cx="105" cy="275" r="38" fill="${accentColor}"/>
  <text x="105" y="285" font-size="24" font-weight="700" fill="#FFFFFF" text-anchor="middle">${name.charAt(0)}</text>

  <!-- Name & Handle -->
  <text x="170" y="280" font-size="22" font-weight="700" fill="#16181D">${name}</text>
  <text x="170" y="302" font-size="15" font-weight="500" fill="#7A7468">@${username} · Verified Sample</text>

  <!-- Bio Box -->
  <rect x="40" y="340" width="520" height="95" rx="16" fill="#F9F7F2" stroke="#ECE8DF" stroke-width="1"/>
  <text x="60" y="375" font-size="14" font-weight="500" fill="#2C2A24">
    <tspan x="60" dy="0">${bio.slice(0, 55)}</tspan>
    <tspan x="60" dy="24">${bio.slice(55, 115)}</tspan>
    <tspan x="60" dy="24">${bio.slice(115, 175)}</tspan>
  </text>

  <!-- Sample Profile Watermark -->
  <rect x="40" y="455" width="520" height="36" rx="8" fill="#FFF4F0" stroke="#FDD8D0" stroke-width="1"/>
  <text x="300" y="478" font-size="12" font-weight="700" fill="#D9482B" text-anchor="middle">🛡️ SAMPLE TEST PROFILE — PROCEDURALLY GENERATED (NO REAL PERSON)</text>

  <!-- Stats Grid -->
  <line x1="40" y1="510" x2="560" y2="510" stroke="#ECE8DF" stroke-width="1"/>
  <text x="110" y="540" font-size="18" font-weight="700" fill="#16181D" text-anchor="middle">248</text>
  <text x="110" y="560" font-size="12" fill="#7A7468" text-anchor="middle">Posts</text>
  <text x="300" y="540" font-size="18" font-weight="700" fill="#16181D" text-anchor="middle">1.4K</text>
  <text x="300" y="560" font-size="12" fill="#7A7468" text-anchor="middle">Followers</text>
  <text x="490" y="540" font-size="18" font-weight="700" fill="#16181D" text-anchor="middle">412</text>
  <text x="490" y="560" font-size="12" fill="#7A7468" text-anchor="middle">Following</text>
  <line x1="40" y1="585" x2="560" y2="585" stroke="#ECE8DF" stroke-width="1"/>

  <!-- Post Grid previews -->
  <rect x="45" y="605" width="155" height="100" rx="10" fill="#EDE9DF"/>
  <rect x="222" y="605" width="155" height="100" rx="10" fill="#E6E0D4"/>
  <rect x="400" y="605" width="155" height="100" rx="10" fill="#DED7C8"/>
  <text x="122" y="660" font-size="12" fill="#7A7468" text-anchor="middle">Post #1</text>
  <text x="300" y="660" font-size="12" fill="#7A7468" text-anchor="middle">Post #2</text>
  <text x="477" y="660" font-size="12" fill="#7A7468" text-anchor="middle">Post #3</text>
</svg>`;
}

// Generate individual post SVG card with planted clues
function generatePostSvg(username: string, caption: string, clueType: string, index: number): string {
  const clueBadge =
    clueType === 'document'
      ? '⚠️ [PLANTED CLUE: VISIBLE CIN / BADGE]'
      : clueType === 'child'
      ? '⚠️ [PLANTED CLUE: MINOR FACE PRESENT]'
      : clueType === 'workplace'
      ? '⚠️ [PLANTED CLUE: WORKPLACE LOGO & SCHEDULE]'
      : 'ℹ️ [PLANTED CLUE: LOCATION LANDMARK]';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 650" width="600" height="650" style="background:#FAF8F5;font-family:'Manrope',sans-serif;">
  <rect x="20" y="20" width="560" height="610" rx="24" fill="#FFFFFF" stroke="#E5E0D8" stroke-width="2"/>
  
  <!-- Header -->
  <circle cx="55" cy="60" r="18" fill="#D5CEBE"/>
  <text x="85" y="60" font-size="15" font-weight="700" fill="#16181D">@${username}</text>
  <text x="85" y="76" font-size="12" fill="#7A7468">2 days ago · Public Post</text>

  <!-- Image content simulated canvas -->
  <rect x="40" y="100" width="520" height="340" rx="14" fill="#F0ECE3" stroke="#E2DCD0" stroke-width="1.5"/>
  <rect x="60" y="120" width="480" height="220" rx="10" fill="#E4DDCF"/>

  <!-- Planted visual clue simulation graphic -->
  <rect x="90" y="160" width="420" height="140" rx="8" fill="#FFFFFF" stroke="#C4B9A5" stroke-width="1.5"/>
  <text x="300" y="210" font-size="16" font-weight="700" fill="#16181D" text-anchor="middle">${clueBadge}</text>
  <text x="300" y="240" font-size="13" font-weight="500" fill="#666053" text-anchor="middle">Simulation Asset: ${caption.slice(0, 48)}</text>
  <text x="300" y="270" font-size="11" fill="#8C8474" text-anchor="middle">Procedural Test Vector for Kashif Exposure Verification Engine</text>

  <!-- Caption area -->
  <text x="50" y="475" font-size="14" font-weight="700" fill="#16181D">@${username}</text>
  <text x="50" y="505" font-size="14" font-weight="400" fill="#2C2A24">
    <tspan x="50" dy="0">${caption.slice(0, 60)}</tspan>
    <tspan x="50" dy="22">${caption.slice(60, 120)}</tspan>
  </text>

  <!-- Action bar -->
  <line x1="40" y1="560" x2="560" y2="560" stroke="#ECE8DF" stroke-width="1"/>
  <text x="60" y="590" font-size="13" fill="#666053">❤️ 142 likes · 💬 18 comments</text>
  <text x="540" y="590" font-size="11" font-weight="600" fill="#C98A1B" text-anchor="end">SYNTHETIC POST #${index}</text>
</svg>`;
}

export function generateSyntheticProfiles(): SyntheticProfile[] {
  const tiers: Array<'low' | 'medium' | 'high' | 'critical'> = [
    'low', 'low', 'low',
    'medium', 'medium', 'medium',
    'high', 'high', 'high',
    'critical', 'critical', 'critical',
  ];

  // Shuffle tiers to ensure non-fixed order as specified
  for (let i = tiers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiers[i], tiers[j]] = [tiers[j], tiers[i]];
  }

  const profiles: SyntheticProfile[] = [];

  for (let idx = 0; idx < 12; idx++) {
    const firstName = MOROCCAN_FIRST_NAMES[idx % MOROCCAN_FIRST_NAMES.length];
    const lastName = MOROCCAN_LAST_NAMES[idx % MOROCCAN_LAST_NAMES.length];
    const name = `${firstName} ${lastName}`;
    const username = `${firstName.toLowerCase().replace(/\s+/g, '_')}_${lastName.toLowerCase()}${Math.floor(Math.random() * 89 + 10)}`;
    const city = MOROCCAN_CITIES[idx % MOROCCAN_CITIES.length];
    const tier = tiers[idx];
    const workplace = WORKPLACES[idx % WORKPLACES.length];

    let bio = '';
    let children_present = false;
    let documents_exposed = false;
    let exif_gps_present = false;
    let expectedRange: [number, number] = [0, 25];

    const posts: SyntheticProfile['posts'] = [];

    if (tier === 'critical') {
      bio = `Software Engineer @ ${workplace} · Living in ${city} · Proud dad of 2 · CIN #BK${Math.floor(Math.random() * 899999 + 100000)}`;
      children_present = true;
      documents_exposed = true;
      exif_gps_present = true;
      expectedRange = [76, 100];

      posts.push({
        id: `post_${idx}_1`,
        caption: `Finally picked up my new company security badge and renewed CIN at the district police station in ${city}! Ready for next week.`,
        image_svg: generatePostSvg(username, `Renewed official badge and CIN photo at local office`, 'document', 1),
        clues: ['Legible official ID and badge', 'Workplace affiliation', 'Exact city office'],
      });
      posts.push({
        id: `post_${idx}_2`,
        caption: `School pickup time with the kids outside nursery in ${city} before heading back to the office!`,
        image_svg: generatePostSvg(username, `Picking up children outside nursery gate`, 'child', 2),
        clues: ['Minor children faces visible', 'Daily schedule and nursery gate'],
      });
    } else if (tier === 'high') {
      bio = `Lead Project Manager at ${workplace} · ${city} enthusiast · Daily runs around ${city}`;
      children_present = idx % 2 === 0;
      documents_exposed = false;
      exif_gps_present = true;
      expectedRange = [51, 75];

      posts.push({
        id: `post_${idx}_1`,
        caption: `Late night sprint at ${workplace}, desk setup looking clean with the team dashboard visible on the monitor!`,
        image_svg: generatePostSvg(username, `Office desk with visible monitors and badge lanyard`, 'workplace', 1),
        clues: ['Visible internal monitors', 'Workplace company branding'],
      });
      posts.push({
        id: `post_${idx}_2`,
        caption: `Morning coffee run right downstairs at our usual corner in ${city} every day at 8:15 AM sharp.`,
        image_svg: generatePostSvg(username, `Coffee shop storefront with visible street sign`, 'location', 2),
        clues: ['Daily precise schedule', 'Recognizable neighborhood shop'],
      });
    } else if (tier === 'medium') {
      bio = `Product Designer · Coffee & Tech · Based in Morocco (${city})`;
      children_present = false;
      documents_exposed = false;
      exif_gps_present = false;
      expectedRange = [26, 50];

      posts.push({
        id: `post_${idx}_1`,
        caption: `Excited for the upcoming creative industry summit in ${city}! Catch me speaking on Friday.`,
        image_svg: generatePostSvg(username, `Event conference stage announcement`, 'location', 1),
        clues: ['Event location and date'],
      });
      posts.push({
        id: `post_${idx}_2`,
        caption: `Weekend sketches and design explorations from my favorite café terrace.`,
        image_svg: generatePostSvg(username, `Notebook and coffee cup on table`, 'location', 2),
        clues: ['General city area'],
      });
    } else {
      // low
      bio = 'Digital art & photography hobbyist. Learning 3D animation.';
      children_present = false;
      documents_exposed = false;
      exif_gps_present = false;
      expectedRange = [0, 25];

      posts.push({
        id: `post_${idx}_1`,
        caption: 'Latest 3D abstract render made with Blender. Light study #4.',
        image_svg: generatePostSvg(username, `Abstract digital 3D geometry render`, 'none', 1),
        clues: [],
      });
      posts.push({
        id: `post_${idx}_2`,
        caption: 'Color palette experiments for a future mobile UI concept.',
        image_svg: generatePostSvg(username, `Color swatch digital illustration`, 'none', 2),
        clues: [],
      });
    }

    const profileCardSvg = generateProfileCardSvg(name, username, city, bio, tier);

    // Build realistic simulated social archive export tailored to the tier ground truth
    let simulated_export: FullExportData;

    if (tier === 'critical') {
      simulated_export = {
        platform: 'instagram',
        account: {
          username,
          full_name: name,
          bio,
          email: `${username.split('_')[0]}.${username.split('_')[1] || 'user'}@gmail.com`,
          phone: `+212 6${Math.floor(Math.random() * 89999999 + 10000000)}`,
          created_at: `Septembre ${2018 + (idx % 3)}`,
          follower_count: Math.floor(Math.random() * 1500 + 1200),
          following_count: Math.floor(Math.random() * 400 + 300),
        },
        captions_history: [
          ...posts.map((p) => ({ text: p.caption, timestamp: '2024-03-14', location_name: city })),
          { text: `Déjeuner d'équipe à ${city} après un super sprint au ${workplace} !`, timestamp: '2024-02-18', location_name: city },
          { text: `Préparation du voyage d'affaires et visite technique.`, timestamp: '2024-01-20', location_name: 'Tanger Med' },
        ],
        comments_history: [
          { text: `Merci @karim_tazi pour le contact du pédiatre à ${city} !`, timestamp: '2024-03-02', to_account: 'karim_tazi' },
          { text: `Super initiative, on se voit au bureau demain matin à 8h30.`, timestamp: '2024-02-28', to_account: 'collegue_bureau' },
          { text: `Top le nouvel appart, félicitations pour l'installation !`, timestamp: '2024-01-15', to_account: 'ami_famille' },
        ],
        search_history: [
          { query: `centre de renouvellement passeport et CIN ${city.split(' ')[0]}`, timestamp: '2024-03-10' },
          { query: 'frais de livraison amana poste maroc', timestamp: '2024-03-05' },
          { query: 'attijariwafa bank opposition carte guichet', timestamp: '2024-02-22' },
          { query: `crèche garderie bilingue ${city.split(' ')[0]}`, timestamp: '2024-02-10' },
          { query: 'vols casablanca paris ram promotions', timestamp: '2024-01-30' },
        ],
        location_timeline: [
          { timestamp: '2024-03-12', name: `${workplace}`, city: city.split(' ')[0], source: 'Instagram Post Location Tag' },
          { timestamp: '2024-03-08', name: `Café Paul - Bd d'Anfa, ${city.split(' ')[0]}`, city: city.split(' ')[0], source: 'Instagram Check-in' },
          { timestamp: '2024-02-26', name: `Gare Casa-Port, Casablanca`, city: 'Casablanca', source: 'Instagram Story Location' },
          { timestamp: '2024-02-14', name: `Twin Center Maârif`, city: 'Casablanca', lat: 33.5862, lon: -7.6324, source: 'Instagram Device Session Tracking' },
          { timestamp: '2024-01-22', name: `Aéroport Mohammed V (CMN)`, city: 'Casablanca', lat: 33.3675, lon: -7.5899, source: 'Logged Session Location' },
        ],
        ad_interests: [
          'Banques et crédits consommation Maroc',
          'Immobilier et logements Casablanca',
          'Voyages et séjours Marrakech',
          'Véhicules d\'occasion et leasing',
          'Éducation et écoles privées',
        ],
        total_posts_found: 142 + idx * 10,
        total_comments_found: 380 + idx * 15,
        total_searches_found: 64 + idx * 5,
        total_photos_found: 142 + idx * 10,
        analyzed_photos_count: posts.length + 1,
      };
    } else if (tier === 'high') {
      simulated_export = {
        platform: 'instagram',
        account: {
          username,
          full_name: name,
          bio,
          email: `${username.split('_')[0]}.${username.split('_')[1] || 'user'}@gmail.com`,
          phone: `+212 6${Math.floor(Math.random() * 89999999 + 10000000)}`,
          created_at: `Mars ${2019 + (idx % 3)}`,
          follower_count: Math.floor(Math.random() * 900 + 600),
          following_count: Math.floor(Math.random() * 300 + 200),
        },
        captions_history: [
          ...posts.map((p) => ({ text: p.caption, timestamp: '2024-03-14', location_name: city })),
          { text: `Sprint trimestriel terminé avec succès chez ${workplace}.`, timestamp: '2024-02-18', location_name: city },
        ],
        comments_history: [
          { text: `Super initiative, on se voit au bureau demain matin à 8h30.`, timestamp: '2024-02-28', to_account: 'collegue_bureau' },
          { text: `Merci pour le retour sur la présentation technique !`, timestamp: '2024-01-15', to_account: 'partenaire' },
        ],
        search_history: [
          { query: 'vols casablanca paris ram promotions', timestamp: '2024-01-30' },
          { query: `salle de sport et fitness ${city.split(' ')[0]}`, timestamp: '2024-02-14' },
          { query: `location espace de coworking ${city.split(' ')[0]}`, timestamp: '2024-03-01' },
        ],
        location_timeline: [
          { timestamp: '2024-03-12', name: `${workplace}`, city: city.split(' ')[0], source: 'Instagram Post Location Tag' },
          { timestamp: '2024-03-08', name: `Café Paul, ${city.split(' ')[0]}`, city: city.split(' ')[0], source: 'Instagram Check-in' },
          { timestamp: '2024-02-26', name: `Gare de ${city.split(' ')[0]}`, city: city.split(' ')[0], source: 'Instagram Story Tag' },
        ],
        ad_interests: [
          'Voyages et séjours Marrakech',
          'Véhicules d\'occasion et leasing',
          'Technologie et innovation',
        ],
        total_posts_found: 85 + idx * 8,
        total_comments_found: 160 + idx * 10,
        total_searches_found: 28 + idx * 4,
        total_photos_found: 85 + idx * 8,
        analyzed_photos_count: posts.length + 1,
      };
    } else if (tier === 'medium') {
      simulated_export = {
        platform: 'instagram',
        account: {
          username,
          full_name: name,
          bio,
          email: `${username.split('_')[0]}.${username.split('_')[1] || 'user'}@gmail.com`,
          created_at: `Janvier ${2021 + (idx % 3)}`,
          follower_count: Math.floor(Math.random() * 600 + 300),
          following_count: Math.floor(Math.random() * 250 + 100),
        },
        captions_history: [
          ...posts.map((p) => ({ text: p.caption, timestamp: '2024-03-14', location_name: city })),
        ],
        comments_history: [
          { text: `Hâte d'assister à la conférence vendredi !`, timestamp: '2024-03-01', to_account: 'organisateur' },
          { text: `Superbe inspiration pour les palettes de couleurs.`, timestamp: '2024-02-15', to_account: 'designer_ami' },
        ],
        search_history: [
          { query: `programme creative summit ${city.split(' ')[0]}`, timestamp: '2024-03-08' },
          { query: 'meilleures polices arabes figma typography', timestamp: '2024-02-20' },
        ],
        location_timeline: [
          { timestamp: '2024-03-10', name: `Palais des Congrès ${city.split(' ')[0]}`, city: city.split(' ')[0], source: 'Instagram Event Tag' },
        ],
        ad_interests: [
          'Design graphique et UX',
          'Cafés de spécialité',
          'Matériel informatique et écrans',
        ],
        total_posts_found: 42 + idx * 5,
        total_comments_found: 75 + idx * 8,
        total_searches_found: 14 + idx * 3,
        total_photos_found: 42 + idx * 5,
        analyzed_photos_count: posts.length + 1,
      };
    } else {
      // low tier: privacy-conscious user
      simulated_export = {
        platform: 'instagram',
        account: {
          username,
          full_name: name,
          bio,
          created_at: `Juin ${2022 + (idx % 2)}`,
          follower_count: Math.floor(Math.random() * 200 + 100),
          following_count: Math.floor(Math.random() * 100 + 50),
        },
        captions_history: [
          ...posts.map((p) => ({ text: p.caption, timestamp: '2024-03-14', location_name: undefined })),
        ],
        comments_history: [
          { text: `Merci pour le retour sur la texture Blender !`, timestamp: '2024-02-10', to_account: 'art_friend' },
        ],
        search_history: [
          { query: 'tutoriel blender geometry nodes', timestamp: '2024-02-15' },
        ],
        location_timeline: [],
        ad_interests: [
          'Logiciels 3D et infographie',
          'Photographie argentique',
        ],
        total_posts_found: 16 + idx * 2,
        total_comments_found: 24 + idx * 3,
        total_searches_found: 6 + idx * 1,
        total_photos_found: 16 + idx * 2,
        analyzed_photos_count: posts.length + 1,
      };
    }

    profiles.push({
      id: `profile_${(idx + 1).toString().padStart(2, '0')}`,
      name,
      username,
      city,
      severity: tier,
      bio,
      posts,
      profileCardSvg,
      profile_card_svg: profileCardSvg,
      simulated_export,
      ground_truth: {
        workplace: tier !== 'low' ? workplace : undefined,
        city,
        children_present,
        documents_exposed,
        exif_gps_present,
        expected_score_range: expectedRange,
      },
    });
  }

  // Save ground truth to disk
  fs.writeFileSync(path.join(demoDir, 'ground_truth.json'), JSON.stringify(profiles, null, 2));

  return profiles;
}

let cachedSyntheticProfiles: SyntheticProfile[] = [];

export function getOrGenerateSyntheticProfiles(forceRegenerate = false): SyntheticProfile[] {
  if (!forceRegenerate && cachedSyntheticProfiles.length > 0 && cachedSyntheticProfiles[0]?.simulated_export) {
    return cachedSyntheticProfiles;
  }
  const groundTruthPath = path.join(demoDir, 'ground_truth.json');
  if (!forceRegenerate && fs.existsSync(groundTruthPath)) {
    try {
      const loaded: SyntheticProfile[] = JSON.parse(fs.readFileSync(groundTruthPath, 'utf-8'));
      if (loaded.length > 0 && loaded[0]?.simulated_export) {
        cachedSyntheticProfiles = loaded;
        return cachedSyntheticProfiles;
      }
    } catch {
      // fall through to regenerate
    }
  }
  cachedSyntheticProfiles = generateSyntheticProfiles();
  return cachedSyntheticProfiles;
}
