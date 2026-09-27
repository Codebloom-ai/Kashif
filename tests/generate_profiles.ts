import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateSyntheticProfiles } from '../server/synthetic.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outputDir = path.join(rootDir, 'tests', 'output_profiles');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('Generating 12 procedural synthetic Moroccan profiles with ground truth...');
const profiles = generateSyntheticProfiles();

// Write individual cards and ground truth
for (const p of profiles) {
  const profileSubDir = path.join(outputDir, p.id);
  if (!fs.existsSync(profileSubDir)) {
    fs.mkdirSync(profileSubDir, { recursive: true });
  }

  fs.writeFileSync(path.join(profileSubDir, 'profile_card.svg'), p.profileCardSvg, 'utf-8');

  p.posts.forEach((post, i) => {
    fs.writeFileSync(path.join(profileSubDir, `post_${i + 1}.svg`), post.image_svg, 'utf-8');
  });

  fs.writeFileSync(
    path.join(profileSubDir, 'meta.json'),
    JSON.stringify(
      {
        id: p.id,
        name: p.name,
        username: p.username,
        city: p.city,
        tier: p.severity,
        ground_truth: p.ground_truth,
      },
      null,
      2
    )
  );
}

fs.writeFileSync(
  path.join(outputDir, 'ground_truth.json'),
  JSON.stringify(profiles, null, 2)
);

console.log(`Successfully generated ${profiles.length} synthetic test profiles in ${outputDir}!`);
