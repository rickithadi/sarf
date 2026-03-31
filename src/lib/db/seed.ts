import 'dotenv/config';
import { db } from './index';
import { breaks } from './schema/breaks';

const victorianBreaks = [
  {
    id: 'bells-beach',
    name: 'Bells Beach',
    lat: -38.3686,
    lng: 144.2811,
    region: 'Torquay',
    bomStationId: '95890', // Aireys Inlet
    optimalWindDirection: 315, // NW for offshore
  },
  {
    id: 'jan-juc',
    name: 'Jan Juc',
    lat: -38.3483,
    lng: 144.2892,
    region: 'Torquay',
    bomStationId: '95890', // Aireys Inlet
    optimalWindDirection: 315, // NW for offshore
  },
  {
    id: 'torquay',
    name: 'Torquay (Front Beach)',
    lat: -38.3319,
    lng: 144.3197,
    region: 'Torquay',
    bomStationId: '95890', // Aireys Inlet
    optimalWindDirection: 315, // NW for offshore
  },
  {
    id: 'point-leo',
    name: 'Point Leo',
    lat: -38.4342,
    lng: 145.0778,
    region: 'Mornington Peninsula',
    bomStationId: '95867', // Cerberus
    optimalWindDirection: 0, // N for offshore (south-facing beach)
  },
  {
    id: 'gunnamatta',
    name: 'Gunnamatta',
    lat: -38.4583,
    lng: 144.8908,
    region: 'Mornington Peninsula',
    bomStationId: '95867', // Cerberus
    optimalWindDirection: 0, // N for offshore (south-facing beach)
  },
  {
    id: 'portsea',
    name: 'Portsea (Back Beach)',
    lat: -38.3417,
    lng: 144.7169,
    region: 'Mornington Peninsula',
    bomStationId: '95867', // Cerberus
    optimalWindDirection: 0, // N for offshore (south-facing beach)
  },
];

async function seed() {
  console.log('Seeding Victorian surf breaks...');

  for (const breakData of victorianBreaks) {
    await db
      .insert(breaks)
      .values(breakData)
      .onConflictDoUpdate({
        target: breaks.id,
        set: breakData,
      });
    console.log(`  Seeded: ${breakData.name}`);
  }

  console.log('Seeding complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
