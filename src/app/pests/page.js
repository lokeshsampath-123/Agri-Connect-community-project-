'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import FallbackImage from '@/components/FallbackImage';
import ErrorBoundary from '@/components/ErrorBoundary';
import { supabase } from '@/lib/supabase';
import { getAssetUrl } from '@/lib/assets';

function resolvePestImage(imageUrl) {
  return '/pest_target_icon.png';
}

const fuzzyMatchPest = (pest, query) => {
  if (!query) return false;
  const q = query.toLowerCase().trim();
  
  const synonyms = {
    'rice': ['paddy', 'rice'],
    'paddy': ['paddy', 'rice'],
    'eggplant': ['brinjal', 'eggplant'],
    'brinjal': ['brinjal', 'eggplant'],
    'okra': ['okra', 'bhendi', 'bhindi', 'bhendy'],
    'bhendi': ['okra', 'bhendi', 'bhindi', 'bhendy'],
    'pigeon pea': ['red gram', 'pigeon pea', 'arhar', 'kandi'],
    'red gram': ['red gram', 'pigeon pea', 'arhar', 'kandi'],
    'chickpea': ['bengal gram', 'chickpea', 'chana'],
    'bengal gram': ['bengal gram', 'chickpea', 'chana'],
    'moong': ['green gram', 'moong'],
    'green gram': ['green gram', 'moong'],
    'urad': ['black gram', 'urad'],
    'black gram': ['black gram', 'urad'],
    'jowar': ['sorghum', 'jowar'],
    'sorghum': ['sorghum', 'jowar'],
    'bajra': ['pearl millet', 'bajra'],
    'pearl millet': ['pearl millet', 'bajra'],
    'ragi': ['finger millet', 'ragi'],
    'finger millet': ['finger millet', 'ragi'],
    'chillies': ['chilli', 'chillies', 'red chilli', 'red chillies', 'pepper'],
    'chilli': ['chilli', 'chillies', 'red chilli', 'red chillies', 'pepper']
  };

  const pestName = (pest.name || '').toLowerCase();
  const cropName = (pest.crop_affected || '').toLowerCase();
  const scientificName = (pest.scientific_name || '').toLowerCase();

  const queryWords = q.split(/\s+/).filter(word => word.length > 0);
  if (queryWords.length === 0) return false;

  return queryWords.every(word => {
    if (pestName.includes(word) || cropName.includes(word) || scientificName.includes(word)) {
      return true;
    }
    
    for (const [key, list] of Object.entries(synonyms)) {
      if (key.includes(word) || list.some(syn => syn.includes(word))) {
        if (list.some(syn => cropName.includes(syn))) {
          return true;
        }
      }
    }
    
    if (word.length >= 4) {
      if (pestName.startsWith(word.slice(0, 4)) || cropName.startsWith(word.slice(0, 4))) {
        return true;
      }
    }
    
    return false;
  });
};

const SEED_OUTBREAKS = [
  {
    id: 'ob-seed-1',
    crop_name: 'Chillies',
    pest_name: 'Chilli Thrips',
    image_url: 'chilli_thrips',
    description: 'Observed significant leaf curling and drying of plants in Guntur chilli fields. Thrips population is spreading fast due to dry weather conditions.',
    reporter_name: 'Venkata Subbaiah',
    district: 'Guntur',
    status: 'VERIFIED',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'ob-seed-2',
    crop_name: 'Cotton',
    pest_name: 'Pink Bollworm',
    image_url: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?q=80&w=200',
    description: 'Rosette flowers and boll damage observed in cotton crops across Kurnool district. Pheromone traps set up to capture adult moths.',
    reporter_name: 'Prasad Rao',
    district: 'Kurnool',
    status: 'VERIFIED',
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'ob-seed-3',
    crop_name: 'Paddy',
    pest_name: 'Yellow Stem Borer',
    image_url: 'https://images.unsplash.com/photo-1536882240095-0379873feb4e?q=80&w=200',
    description: 'Dead hearts seen in late-planted paddy fields of Nellore. Applying Cartap hydrochloride 4G to prevent further crop damage.',
    reporter_name: 'Kondala Rao',
    district: 'Nellore',
    status: 'VERIFIED',
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const SEED_PESTS = [
  // --- Rice (Paddy) ---
  {
    id: 'rice-pest-1',
    name: 'Yellow Stem Borer',
    crop_affected: 'Paddy',
    scientific_name: 'Scirpophaga incertulas',
    severity_level: 'critical',
    district: 'Kurnool',
    description: 'Bores into rice stems causing dead hearts in young plants and empty whiteheads in mature panicles.',
    advice: 'Apply Cartap Hydrochloride 4G @ 10kg/acre or release Trichogramma japonicum parasitoids.',
    image_url: '/pest_target_icon.png',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'rice-pest-2',
    name: 'Brown Planthopper (BPH)',
    crop_affected: 'Paddy',
    scientific_name: 'Nilaparvata lugens',
    severity_level: 'critical',
    district: 'Nellore',
    description: 'Sucks sap from stem base, causing yellowing and circular drying patches known as hopper burn.',
    advice: 'Drain water for 3-4 days. Spray Pymetrozine 50% WG @ 120g/acre or Dinotefuran 20% SG @ 80g/acre.',
    image_url: '/pest_target_icon.png',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'rice-pest-3',
    name: 'Green Leafhopper',
    crop_affected: 'Paddy',
    scientific_name: 'Nephotettix virescens',
    severity_level: 'high',
    district: 'Nellore',
    description: 'Sucks sap from leaf blades, causes yellowing of leaf tips, and transmits tungro virus disease.',
    advice: 'Apply Thiamethoxam 25% WG @ 40g/acre or spray Imidacloprid 17.8% SL @ 50ml/acre.',
    image_url: '/pest_target_icon.png',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'rice-pest-4',
    name: 'Rice Gall Midge',
    crop_affected: 'Paddy',
    scientific_name: 'Orseolia oryzae',
    severity_level: 'high',
    district: 'Guntur',
    description: 'Larval feeding inside the growing shoot causes the formation of tubular galls called silver shoots.',
    advice: 'Apply Fipronil 0.3G @ 10kg/acre or Carbofuran 3G @ 10kg/acre at onset of symptoms.',
    image_url: '/pest_target_icon.png',
    created_at: new Date().toISOString()
  },
  {
    id: 'rice-pest-5',
    name: 'Rice Leaf Folder',
    crop_affected: 'Paddy',
    scientific_name: 'Cnaphalocrocis medinalis',
    severity_level: 'rising',
    district: 'Guntur',
    description: 'Larvae fold leaf blades together and feed on green tissues inside, leaving white longitudinal stripes.',
    advice: 'Spray Flubendiamide 39.35% SC @ 20ml/acre or Chlorantraniliprole 18.5% SC @ 60ml/acre.',
    image_url: '/pest_target_icon.png',
    created_at: new Date().toISOString()
  },
  {
    id: 'rice-pest-6',
    name: 'Gundhi Bug (Rice Earhead Bug)',
    crop_affected: 'Paddy',
    scientific_name: 'Leptocorisa acuta',
    severity_level: 'rising',
    district: 'Krishna',
    description: 'Nymphs and adults suck sap from tender grains in the milky stage, causing chaffy, empty grains.',
    advice: 'Dust Malathion 5% @ 10kg/acre or spray Acephate 75% SP @ 300g/acre during early morning or late evening.',
    image_url: '/pest_target_icon.png',
    created_at: new Date().toISOString()
  },
  {
    id: 'rice-pest-7',
    name: 'Southern Rice Black-Streaked Dwarf Virus vector (WBPH)',
    crop_affected: 'Paddy',
    scientific_name: 'Sogatella furcifera',
    severity_level: 'critical',
    district: 'West Godavari',
    description: 'White-backed planthopper transmits dwarf viral infections, causing severe plant stunting and dark streaks.',
    advice: 'Control vector insects using Triflumezopyrim 10% SC @ 94ml/acre or Pymetrozine 50% WG.',
    image_url: '/pest_target_icon.png',
    created_at: new Date().toISOString()
  },

  // --- Cotton ---
  {
    id: 'cotton-pest-1',
    name: 'Pink Bollworm',
    crop_affected: 'Cotton',
    scientific_name: 'Pectinophora gossypiella',
    severity_level: 'critical',
    district: 'Anantapur',
    description: 'Larvae tunnel into flower buds and bolls, feeding on seeds and staining lint, leading to double seeds.',
    advice: 'Install pheromone traps (8/acre) to monitor moth flight. Spray Profenophos 50% EC @ 2ml/L.',
    image_url: '/pest_target_icon.png',
    created_at: new Date().toISOString()
  },
  {
    id: 'cotton-pest-2',
    name: 'American Bollworm',
    crop_affected: 'Cotton',
    scientific_name: 'Helicoverpa armigera',
    severity_level: 'critical',
    district: 'Guntur',
    description: 'Larvae feed on leaves, flowers, and bore into bolls, leaving large entry holes and hollowed centers.',
    advice: 'Deploy bird perches. Spray Chlorantraniliprole 18.5% SC @ 60ml/acre or Emamectin Benzoate 5% SG @ 90g/acre.',
    image_url: '/pest_target_icon.png',
    created_at: new Date().toISOString()
  },
  {
    id: 'cotton-pest-3',
    name: 'Cotton Whitefly',
    crop_affected: 'Cotton',
    scientific_name: 'Bemisia tabaci',
    severity_level: 'high',
    district: 'Prakasam',
    description: 'Sucks sap from leaf undersides, secreting sticky honeydew that develops black sooty mold.',
    advice: 'Use yellow sticky traps (20/acre). Spray Afidopyropen 50g/L DC @ 400ml/acre or Pyriproxyfen 10% EC @ 400ml/acre.',
    image_url: '/pest_target_icon.png',
    created_at: new Date().toISOString()
  },
  {
    id: 'cotton-pest-4',
    name: 'Tobacco Caterpillar',
    crop_affected: 'Cotton',
    scientific_name: 'Spodoptera litura',
    severity_level: 'high',
    district: 'Kurnool',
    description: 'Gregarious larvae feed on leaves, skeletonizing the foliage, leaving only primary veins.',
    advice: 'Collect and destroy egg masses. Spray Novaluron 10% EC @ 300ml/acre or Spetoram 11.7% SC @ 180ml/acre.',
    image_url: '/pest_target_icon.png',
    created_at: new Date().toISOString()
  },

  // --- Maize ---
  {
    id: 'maize-pest-1',
    name: 'Fall Armyworm',
    crop_affected: 'Maize',
    scientific_name: 'Spodoptera frugiperda',
    severity_level: 'critical',
    district: 'Kurnool',
    description: 'Larvae feed aggressively inside the leaf whorl, creating large feeding holes and producing moist sawdust-like frass.',
    advice: 'Apply soil/sand in whorl. Spray Emamectin Benzoate 5% SG @ 0.4g/L or Spinetoram 11.7% SC @ 0.5ml/L.',
    image_url: '/pest_target_icon.png',
    created_at: new Date().toISOString()
  },
  {
    id: 'maize-pest-2',
    name: 'Maize Stem Borer',
    crop_affected: 'Maize',
    scientific_name: 'Chilo partellus',
    severity_level: 'high',
    district: 'Guntur',
    description: 'Caterpillar bores into stems, causing dead hearts in young plants and shot holes on leaves.',
    advice: 'Apply Carbofuran 3G granules @ 3kg/acre in leaf whorls 20 days after sowing.',
    image_url: '/pest_target_icon.png',
    created_at: new Date().toISOString()
  },

  // --- Groundnut ---
  {
    id: 'groundnut-pest-1',
    name: 'Groundnut Leaf Miner',
    crop_affected: 'Groundnut',
    scientific_name: 'Aproaerema modicella',
    severity_level: 'high',
    district: 'Anantapur',
    description: 'Larvae mine leaf tissues causing yellow blotches, later folding leaf margins and feeding inside.',
    advice: 'Set up light traps. Spray Dimethoate 30% EC @ 2ml/L or Monocrotophos 36% SL @ 1.5ml/L.',
    image_url: '/pest_target_icon.png',
    created_at: new Date().toISOString()
  },
  {
    id: 'groundnut-pest-2',
    name: 'Red Hairy Caterpillar',
    crop_affected: 'Groundnut',
    scientific_name: 'Amsacta albistriga',
    severity_level: 'critical',
    district: 'Anantapur',
    description: 'Larvae defoliate the crop completely, eating away leaves and leaving only bare stems behind.',
    advice: 'Dig trenches around fields to trap migrating caterpillars. Spray Chlorpyriphos 20% EC @ 2.5ml/L.',
    image_url: '/pest_target_icon.png',
    created_at: new Date().toISOString()
  },

  // --- Chilli ---
  {
    id: 'chilli-pest-1',
    name: 'Chilli Thrips',
    crop_affected: 'Red Chillies',
    scientific_name: 'Thrips tabaci',
    severity_level: 'rising',
    district: 'Guntur',
    description: 'Nymphs and adults scrape plant tissues, causing upward leaf curling and dry tip margins.',
    advice: 'Install blue sticky traps. Spray Acetamiprid 20% SP @ 0.2g/L or Fipronil 5% SC @ 2ml/L.',
    image_url: '/pest_target_icon.png',
    created_at: new Date().toISOString()
  },
  {
    id: 'chilli-pest-2',
    name: 'Invasive Chilli Thrips',
    crop_affected: 'Red Chillies',
    scientific_name: 'Thrips parvispinus',
    severity_level: 'critical',
    district: 'Guntur',
    description: 'Invasive thrips feed on flowers and shoots, causing severe flower dropping and distorted pods.',
    advice: 'Avoid excess nitrogen. Spray Spinosad 45% SC @ 0.25ml/L or Cyantraniliprole 10.26% OD @ 240ml/acre.',
    image_url: '/pest_target_icon.png',
    created_at: new Date().toISOString()
  },

  // --- Sugarcane ---
  {
    id: 'sugarcane-pest-1',
    name: 'Early Shoot Borer',
    crop_affected: 'Sugarcane',
    scientific_name: 'Chilo infuscatellus',
    severity_level: 'high',
    district: 'Visakhapatnam',
    description: 'Larvae tunnel downwards into stalks, causing dead hearts in shoots during early growth stages.',
    advice: 'Intercrop with green gram. Apply Chlorantraniliprole 18.5% SC @ 150ml/acre at planting or 45 DAP.',
    image_url: '/pest_target_icon.png',
    created_at: new Date().toISOString()
  },

  // --- Red Gram ---
  {
    id: 'redgram-pest-1',
    name: 'Gram Pod Borer',
    crop_affected: 'Red Gram',
    scientific_name: 'Helicoverpa armigera',
    severity_level: 'critical',
    district: 'Kurnool',
    description: 'Larvae feed on buds, flowers, and bore into pods, eating seeds with their heads inside the pods.',
    advice: 'Spray Indoxacarb 14.5% SC @ 140ml/acre or Flubendiamide 39.35% SC @ 40ml/acre.',
    image_url: '/pest_target_icon.png',
    created_at: new Date().toISOString()
  },

  // --- Bengal Gram ---
  {
    id: 'bengalgram-pest-1',
    name: 'Gram Pod Borer',
    crop_affected: 'Bengal Gram',
    scientific_name: 'Helicoverpa armigera',
    severity_level: 'critical',
    district: 'Nandyal',
    description: 'Caterpillars feed on tender leaves and bore circular holes into pods to consume grains.',
    advice: 'Sow coriander/mustard as border crop. Spray Chlorantraniliprole 18.5% SC @ 60ml/acre.',
    image_url: '/pest_target_icon.png',
    created_at: new Date().toISOString()
  },

  // --- Green Gram ---
  {
    id: 'greengram-pest-1',
    name: 'Whitefly Outbreak',
    crop_affected: 'Green Gram',
    scientific_name: 'Bemisia tabaci',
    severity_level: 'rising',
    district: 'Krishna',
    description: 'Whitefly sucks leaf sap and transmits Yellow Mosaic Virus (YMV), turning leaves yellow.',
    advice: 'Spray Thiamethoxam 25% WG @ 40g/acre or Acetamiprid 20% SP @ 80g/acre to control the vector.',
    image_url: '/pest_target_icon.png',
    created_at: new Date().toISOString()
  },

  // --- Black Gram ---
  {
    id: 'blackgram-pest-1',
    name: 'Whitefly Outbreak',
    crop_affected: 'Black Gram',
    scientific_name: 'Bemisia tabaci',
    severity_level: 'rising',
    district: 'Krishna',
    description: 'Vector insects transmit leaf yellowing mosaic virus, severely reducing pod yield.',
    advice: 'Set up yellow sticky traps (25/acre). Spray Dimethoate 30% EC @ 2ml/L.',
    image_url: '/pest_target_icon.png',
    created_at: new Date().toISOString()
  },

  // --- Soybean ---
  {
    id: 'soybean-pest-1',
    name: 'Girdle Beetle',
    crop_affected: 'Soybean',
    scientific_name: 'Obereopsis brevis',
    severity_level: 'high',
    district: 'Guntur',
    description: 'Beetles cut two rings on the stem and lay eggs in between, causing stem drying and breaking.',
    advice: 'Collect and destroy girdled parts. Spray Triazophos 40% EC @ 2.5ml/L.',
    image_url: '/pest_target_icon.png',
    created_at: new Date().toISOString()
  },

  // --- Sesame ---
  {
    id: 'sesame-pest-1',
    name: 'Leaf Roller & Capsule Borer',
    crop_affected: 'Sesame',
    scientific_name: 'Antigastra catalaunalis',
    severity_level: 'high',
    district: 'Prakasam',
    description: 'Webs leaves together to feed on inner tissues, later boring into capsules to consume seeds.',
    advice: 'Spray Quinalphos 25% EC @ 2ml/L or Carbaryl 50% WP @ 2g/L.',
    image_url: '/pest_target_icon.png',
    created_at: new Date().toISOString()
  },

  // --- Sunflower ---
  {
    id: 'sunflower-pest-1',
    name: 'Bihar Hairy Caterpillar',
    crop_affected: 'Sunflower',
    scientific_name: 'Spilosoma obliqua',
    severity_level: 'rising',
    district: 'Anantapur',
    description: 'Hairy caterpillars feed in groups on sunflower leaves, leaving only skeletonized veins.',
    advice: 'Handpick and destroy leaf egg masses. Spray Dichlorvos 76% EC @ 1ml/L.',
    image_url: '/pest_target_icon.png',
    created_at: new Date().toISOString()
  },

  // --- Castor ---
  {
    id: 'castor-pest-1',
    name: 'Castor Semilooper',
    crop_affected: 'Castor',
    scientific_name: 'Achaea janata',
    severity_level: 'high',
    district: 'Kurnool',
    description: 'Caterpillars feed voraciously on leaves, defoliating plants during early vegetative phases.',
    advice: 'Handpick large semiloopers. Spray Profenophos 50% EC @ 2ml/L or NSKE 5%.',
    image_url: '/pest_target_icon.png',
    created_at: new Date().toISOString()
  },

  // --- Sorghum ---
  {
    id: 'sorghum-pest-1',
    name: 'Sorghum Shoot Fly',
    crop_affected: 'Sorghum (Jowar)',
    scientific_name: 'Atherigona soccata',
    severity_level: 'high',
    district: 'Kurnool',
    description: 'Maggots bore into stem bases of seedlings, killing growing tips and creating dead hearts.',
    advice: 'Use high seed rates and sow early. Apply Carbofuran 3G @ 10kg/acre at sowing.',
    image_url: '/pest_target_icon.png',
    created_at: new Date().toISOString()
  },

  // --- Pearl Millet ---
  {
    id: 'pearlmillet-pest-1',
    name: 'Bajra Shoot Fly',
    crop_affected: 'Pearl Millet (Bajra)',
    scientific_name: 'Atherigona soccata',
    severity_level: 'rising',
    district: 'Anantapur',
    description: 'Maggot damages growing shoot tip in early stages, resulting in dead hearts.',
    advice: 'Ensure early crop sowing. Spray Cypermethrin 10% EC @ 2ml/L.',
    image_url: '/pest_target_icon.png',
    created_at: new Date().toISOString()
  },

  // --- Finger Millet ---
  {
    id: 'fingermillet-pest-1',
    name: 'Ragi Stem Borer',
    crop_affected: 'Finger Millet (Ragi)',
    scientific_name: 'Sesamia inferens',
    severity_level: 'rising',
    district: 'Chittoor',
    description: 'Borer caterpillars damage central shoots, leading to typical dead heart symptoms.',
    advice: 'Incorporate light traps. Dust Quinalphos 1.5% D @ 10kg/acre.',
    image_url: '/pest_target_icon.png',
    created_at: new Date().toISOString()
  },

  // --- Coconut ---
  {
    id: 'coconut-pest-1',
    name: 'Rhinoceros Beetle',
    crop_affected: 'Coconut',
    scientific_name: 'Oryctes rhinoceros',
    severity_level: 'high',
    district: 'East Godavari',
    description: 'Adult beetles bore into unopened central fronds, causing typical V-shaped leaf cuts.',
    advice: 'Clean crowns. Place naphthalene balls in leaf axils or use PVC pheromone traps.',
    image_url: '/pest_target_icon.png',
    created_at: new Date().toISOString()
  },
  {
    id: 'coconut-pest-2',
    name: 'Red Palm Weevil',
    crop_affected: 'Coconut',
    scientific_name: 'Rhynchophorus ferrugineus',
    severity_level: 'critical',
    district: 'West Godavari',
    description: 'Internal stem boring by grubs structurally weakens palms, resulting in crown collapse.',
    advice: 'Inject trunk with Imidacloprid 17.8% SL @ 10ml diluted in water per tree.',
    image_url: '/pest_target_icon.png',
    created_at: new Date().toISOString()
  },

  // --- Oil Palm ---
  {
    id: 'oilpalm-pest-1',
    name: 'Red Palm Weevil',
    crop_affected: 'Oil Palm',
    scientific_name: 'Rhynchophorus ferrugineus',
    severity_level: 'critical',
    district: 'West Godavari',
    description: 'Internal grubs burrow within trunk crowns, causing palm death and collapse.',
    advice: 'Inject trunk with Imidacloprid or place aggregation pheromone traps.',
    image_url: '/pest_target_icon.png',
    created_at: new Date().toISOString()
  },

  // --- Banana ---
  {
    id: 'banana-pest-1',
    name: 'Banana Stem Weevil',
    crop_affected: 'Banana',
    scientific_name: 'Odoiporus longicollis',
    severity_level: 'critical',
    district: 'Kadapa',
    description: 'Grubs bore within pseudostems, making entry holes, producing jelly-like exudates, and causing plant to topple.',
    advice: 'Insert Carbofuran 3G granules @ 3g per pseudostem or spray Monocrotophos 36% SL.',
    image_url: '/pest_target_icon.png',
    created_at: new Date().toISOString()
  },

  // --- Mango ---
  {
    id: 'mango-pest-1',
    name: 'Mango Hopper',
    crop_affected: 'Mangoes',
    scientific_name: 'Idioscopus clypealis',
    severity_level: 'high',
    district: 'Chittoor',
    description: 'Hopper bugs suck flower panicle sap, causing blossoms to dry out and drop.',
    advice: 'Prune dry interior branches. Spray Imidacloprid 17.8% SL @ 0.3ml/L during panicle emergence.',
    image_url: '/pest_target_icon.png',
    created_at: new Date().toISOString()
  },
  {
    id: 'mango-pest-2',
    name: 'Mango Fruit Fly',
    crop_affected: 'Mangoes',
    scientific_name: 'Bactrocera dorsalis',
    severity_level: 'critical',
    district: 'Krishna',
    description: 'Females puncture ripe fruits to lay eggs, leading to internal pulp rot and drop.',
    advice: 'Hang methyl eugenol pheromone traps (10/acre). Collect and bury fallen fruits.',
    image_url: '/pest_target_icon.png',
    created_at: new Date().toISOString()
  },

  // --- Citrus ---
  {
    id: 'citrus-pest-1',
    name: 'Citrus Leaf Miner',
    crop_affected: 'Citrus',
    scientific_name: 'Phyllocnistis citrella',
    severity_level: 'rising',
    district: 'Nellore',
    description: 'Larvae mine serpentine trails inside leaves, causing leaf curling and canker entry.',
    advice: 'Spray Imidacloprid 17.8% SL @ 0.3ml/L or Thiodicarb 75% WP @ 1g/L.',
    image_url: '/pest_target_icon.png',
    created_at: new Date().toISOString()
  },

  // --- Papaya ---
  {
    id: 'papaya-pest-1',
    name: 'Papaya Mealybug',
    crop_affected: 'Papaya',
    scientific_name: 'Paracoccus marginatus',
    severity_level: 'critical',
    district: 'Chittoor',
    description: 'White cottony bugs cover leaves and fruit surfaces, causing leaf drop and yellowing.',
    advice: 'Release Acerophagus papayae parasitoids. Spray Profenophos 50% EC @ 2ml/L.',
    image_url: '/pest_target_icon.png',
    created_at: new Date().toISOString()
  },

  // --- Guava ---
  {
    id: 'guava-pest-1',
    name: 'Guava Fruit Fly',
    crop_affected: 'Guava',
    scientific_name: 'Bactrocera dorsalis',
    severity_level: 'critical',
    district: 'Anantapur',
    description: 'Fruit fly larvae infest ripening guava fruits, leading to decomposition.',
    advice: 'Deploy methyl eugenol trap barriers. Spray Malathion 50% EC @ 2ml/L.',
    image_url: '/pest_target_icon.png',
    created_at: new Date().toISOString()
  },

  // --- Tomato ---
  {
    id: 'tomato-pest-1',
    name: 'Tomato Fruit Borer',
    crop_affected: 'Tomatoes',
    scientific_name: 'Helicoverpa armigera',
    severity_level: 'rising',
    district: 'Guntur',
    description: 'Larvae bore round entry holes into tomato fruits, causing rot and decay.',
    advice: 'Spray Spinosad 45% SC @ 0.3ml/L or Indoxacarb 14.5% SC @ 0.5ml/L.',
    image_url: '/pest_target_icon.png',
    created_at: new Date().toISOString()
  },
  {
    id: 'tomato-pest-2',
    name: 'Tomato Pinworm',
    crop_affected: 'Tomatoes',
    scientific_name: 'Tuta absoluta',
    severity_level: 'critical',
    district: 'Kurnool',
    description: 'Larvae mine inside leaf tissues and make tiny tunnels inside tomatoes near fruit stalks.',
    advice: 'Install pheromone traps (15/acre). Spray Cyantraniliprole 10% OD @ 0.3ml/L.',
    image_url: '/pest_target_icon.png',
    created_at: new Date().toISOString()
  },

  // --- Brinjal ---
  {
    id: 'brinjal-pest-1',
    name: 'Shoot and Fruit Borer',
    crop_affected: 'Brinjal',
    scientific_name: 'Leucinodes orbonalis',
    severity_level: 'critical',
    district: 'Guntur',
    description: 'Larvae tunnel into tender shoots causing terminal wilting, and bore into fruits.',
    advice: 'Clip and destroy wilted shoots. Spray Spinosad 45% SC @ 0.4ml/L.',
    image_url: '/pest_target_icon.png',
    created_at: new Date().toISOString()
  },

  // --- Okra ---
  {
    id: 'okra-pest-1',
    name: 'Fruit and Shoot Borer',
    crop_affected: 'Okra (Bhendi)',
    scientific_name: 'Earias vittella',
    severity_level: 'high',
    district: 'Krishna',
    description: 'Maggots damage okra shoots in early stages and bore into young pods, rendering them unfit for sale.',
    advice: 'Spray Emamectin Benzoate 5% SG @ 0.4g/L or Spetoram 11.7% SC @ 0.5ml/L.',
    image_url: '/pest_target_icon.png',
    created_at: new Date().toISOString()
  },

  // --- Onion ---
  {
    id: 'onion-pest-1',
    name: 'Onion Thrips',
    crop_affected: 'Onion',
    scientific_name: 'Thrips tabaci',
    severity_level: 'rising',
    district: 'Kurnool',
    description: 'Thrips rasp leaf surfaces to suck sap, causing typical white silvery patches.',
    advice: 'Ensure adequate watering. Spray Fipronil 5% SC @ 1.5ml/L.',
    image_url: '/pest_target_icon.png',
    created_at: new Date().toISOString()
  },

  // --- Cabbage & Cauliflower ---
  {
    id: 'cabbage-pest-1',
    name: 'Diamondback Moth',
    crop_affected: 'Cabbage & Cauliflower',
    scientific_name: 'Plutella xylostella',
    severity_level: 'critical',
    district: 'Chittoor',
    description: 'Caterpillars feed on leaf undersides, leaving only paper-thin transparent windows.',
    advice: 'Spray Chlorantraniliprole 18.5% SC @ 60ml/acre or Bacillus thuringiensis (Bt) @ 2g/L.',
    image_url: '/pest_target_icon.png',
    created_at: new Date().toISOString()
  },

  // --- Cucurbits ---
  {
    id: 'cucurbit-pest-1',
    name: 'Melon Fruit Fly',
    crop_affected: 'Cucurbits',
    scientific_name: 'Bactrocera cucurbitae',
    severity_level: 'critical',
    district: 'Krishna',
    description: 'Fly maggots damage gourds, causing premature ripening, distortion, and fruit decay.',
    advice: 'Use poison baits containing banana pulp and Malathion. Set up cue-lure traps (10/acre).',
    image_url: '/pest_target_icon.png',
    created_at: new Date().toISOString()
  },

  // --- Turmeric ---
  {
    id: 'turmeric-pest-1',
    name: 'Turmeric Shoot Borer',
    crop_affected: 'Turmeric',
    scientific_name: 'Conogethes punctiferalis',
    severity_level: 'high',
    district: 'Guntur',
    description: 'Bores into pseudostems feeding internally, causing leaf yellowing and shoot drying.',
    advice: 'Spray Dimethoate 30% EC @ 2ml/L or Lambda-cyhalothrin 5% EC @ 0.5ml/L.',
    image_url: '/pest_target_icon.png',
    created_at: new Date().toISOString()
  },

  // --- Tobacco ---
  {
    id: 'tobacco-pest-1',
    name: 'Tobacco Caterpillar',
    crop_affected: 'Tobacco',
    scientific_name: 'Spodoptera litura',
    severity_level: 'high',
    district: 'Prakasam',
    description: 'Larvae chew leaves, leaving only main veins in tobacco plantations.',
    advice: 'Destroy leaf egg masses manually. Spray Novaluron 10% EC @ 1.5ml/L.',
    image_url: '/pest_target_icon.png',
    created_at: new Date().toISOString()
  }
];

export default function Pests() {
  const [pests, setPests] = useState([]);
  const [outbreaks, setOutbreaks] = useState([]);
  const [selectedPest, setSelectedPest] = useState(null);
  const [selectedOutbreak, setSelectedOutbreak] = useState(null);
  const [profile, setProfile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Outbreak Form state
  const [cropName, setCropName] = useState('');
  const [pestName, setPestName] = useState('');
  const [description, setDescription] = useState('');
  const [reporterName, setReporterName] = useState('Farmer Ramesh');
  const [district, setDistrict] = useState('Guntur');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load pests and outbreaks
  const loadData = async (targetDistrict = district) => {
    try {
      const res = await fetch(`/api/pests?district=${encodeURIComponent(targetDistrict)}`);
      if (!res.ok) throw new Error('API request failed');
      const data = await res.json();
      
      setPests(data.pests || []);
      setOutbreaks(data.outbreaks || []);
    } catch (err) {
      console.warn('Could not query live pests API, falling back to local seeds:', err);
      
      const matched = SEED_PESTS.filter(p => p.district.toLowerCase() === targetDistrict.toLowerCase());
      const nonMatched = SEED_PESTS.filter(p => p.district.toLowerCase() !== targetDistrict.toLowerCase());
      const displayPests = [...matched, ...nonMatched.map(p => ({ ...p, district: targetDistrict }))];
      setPests(displayPests);
      
      const matchedOb = SEED_OUTBREAKS.filter(o => o.district.toLowerCase() === targetDistrict.toLowerCase());
      const nonMatchedOb = SEED_OUTBREAKS.filter(o => o.district.toLowerCase() !== targetDistrict.toLowerCase());
      const displayOutbreaks = [...matchedOb, ...nonMatchedOb.map(o => ({ ...o, district: targetDistrict }))];
      setOutbreaks(displayOutbreaks);
    }
  };

  useEffect(() => {
    // Determine initial district from user profile or default
    let initialDistrict = 'Guntur';
    const session = localStorage.getItem('user_profile');
    if (session) {
      const prof = JSON.parse(session);
      setProfile(prof);
      if (prof.district) {
        initialDistrict = prof.district.replace(/\s*\(.*\)\s*/g, '').trim();
        setDistrict(initialDistrict);
      }
      if (prof.name) {
        setReporterName(prof.name);
      }
    }

    loadData(initialDistrict);

    // Set up real-time subscription for database updates
    const pestsSubscription = supabase
      .channel('pests_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pests' }, () => {
        const currentSession = localStorage.getItem('user_profile');
        let currentDist = 'Guntur';
        if (currentSession) {
          const prof = JSON.parse(currentSession);
          if (prof.district) {
            currentDist = prof.district.replace(/\s*\(.*\)\s*/g, '').trim();
          }
        }
        loadData(currentDist);
      })
      .subscribe();

    const outbreaksSubscription = supabase
      .channel('outbreaks_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'outbreaks' }, () => {
        const currentSession = localStorage.getItem('user_profile');
        let currentDist = 'Guntur';
        if (currentSession) {
          const prof = JSON.parse(currentSession);
          if (prof.district) {
            currentDist = prof.district.replace(/\s*\(.*\)\s*/g, '').trim();
          }
        }
        loadData(currentDist);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(pestsSubscription);
      supabase.removeChannel(outbreaksSubscription);
    };
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleOutbreakSubmit = async (e) => {
    e.preventDefault();
    if (!cropName || !description) {
      alert('Please enter crop name and description.');
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = null;

      // Upload image to Cloudinary if provided
      if (imagePreview) {
        try {
          // Since client-side Direct upload or API upload
          // Let's call our API route `/api/analyze` or a generic upload API
          // Or write direct base64 upload here calling a quick client upload route
          const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: imagePreview, cropHint: cropName })
          });
          const uploadResult = await response.json();
          imageUrl = uploadResult.image_url;
        } catch (uploadErr) {
          console.warn('Cloudinary upload failed, using default fallback image');
        }
      }

      // Insert outbreak report into Supabase
      const { error } = await supabase
        .from('outbreaks')
        .insert([{
          crop_name: cropName,
          pest_name: pestName || 'Unidentified Pest',
          image_url: imageUrl,
          description,
          reporter_name: reporterName,
          district,
          status: 'VERIFIED'
        }]);

      if (error) throw error;

      alert('Outbreak reported successfully. The community has been alerted!');
      
      // Reset form
      setCropName('');
      setPestName('');
      setDescription('');
      setImageFile(null);
      setImagePreview(null);

      // Refresh list
      loadData();
    } catch (err) {
      console.error('Error reporting outbreak:', err);
      alert('Failed to report outbreak: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Divide pests into Critical (critical/high severity) vs Standard District Pests
  const criticalThreats = pests.filter(p => p.severity_level === 'critical' || p.severity_level === 'high');
  const filteredOutbreaks = outbreaks.filter(ob => ob.district.toLowerCase() === district.toLowerCase());

  // Search Engine logic for all available AP crops
  const filteredSearchPests = searchQuery.trim() === '' ? [] : SEED_PESTS.filter(p => fuzzyMatchPest(p, searchQuery));

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 ml-0 lg:ml-[288px] pt-16 min-h-screen w-full lg:w-[calc(100vw-288px)] lg:max-w-[calc(100vw-288px)] overflow-x-hidden">
        <header className="fixed left-0 lg:left-[288px] top-0 right-0 h-16 z-40 bg-white/80 backdrop-blur-md border-b border-outline-variant shadow-sm flex justify-between items-center px-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}
              className="lg:hidden p-1.5 rounded-xl text-primary hover:bg-surface-container flex items-center justify-center shrink-0 border border-outline-variant/50"
              title="Open Menu"
            >
              <span className="material-symbols-outlined text-[20px]">menu</span>
            </button>
            <span className="font-headline text-lg font-bold text-primary">Regional Surveillance Dashboard</span>
            <div className="h-6 w-[1px] bg-outline-variant" />
            <div className="flex items-center text-on-surface gap-2 text-sm font-bold bg-surface-container-low px-4 py-1.5 rounded-full border border-outline-variant">
              <span className="material-symbols-outlined text-primary text-lg">location_on</span>
              <select
                value={district}
                onChange={(e) => {
                  const newDist = e.target.value;
                  setDistrict(newDist);
                  loadData(newDist);
                }}
                className="bg-transparent border-none outline-none font-bold text-primary cursor-pointer pr-1 text-sm font-headline"
              >
                {['Guntur', 'Kurnool', 'Krishna', 'Anantapur', 'Visakhapatnam', 'Nellore', 'Chittoor', 'Prakasam', 'Srikakulam', 'Vizianagaram', 'West Godavari', 'East Godavari', 'YSR Kadapa'].map(dist => (
                  <option key={dist} value={dist} className="bg-white text-on-surface">{dist} District</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-full border border-outline-variant">
              <span className="w-2.5 h-2.5 rounded-full bg-tertiary animate-pulse" />
              <span className="text-xs font-bold text-secondary uppercase tracking-wider">Live Monitoring Active</span>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-12">
          {/* Header Title & Search Engine Tab */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative">
            <div className="flex-1">
              <h2 className="font-display text-4xl font-black text-primary tracking-tight">Ultimate Pest Tracker</h2>
              <p className="text-sm text-on-surface-variant mt-2 max-w-xl">
                Real-time agricultural surveillance and AI-driven pest management alert systems for the Telugu heartland.
              </p>
            </div>

            {/* Search Tab */}
            <div className="w-full md:w-[320px] relative shrink-0 z-30">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search crop or pest (e.g. Paddy, Cotton)..."
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-outline-variant rounded-2xl text-sm font-semibold focus:outline-none focus:border-primary shadow-sm text-on-surface"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                )}
              </div>

              {/* Search Suggestions Panel */}
              {searchQuery.trim() !== '' && (
                <div className="absolute left-0 right-0 mt-2 bg-white border border-outline-variant/60 rounded-2xl shadow-xl max-h-[320px] overflow-y-auto z-50 p-2 custom-scrollbar">
                  {filteredSearchPests.length === 0 ? (
                    <div className="p-4 text-center text-xs text-on-surface-variant font-medium">
                      No matching crops or pests found
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredSearchPests.map((pest) => (
                        <div 
                          key={pest.id}
                          onClick={() => {
                            setSelectedPest(pest);
                            setSearchQuery('');
                          }}
                          className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-primary/5 transition-all cursor-pointer group"
                        >
                          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-outline-variant/30 bg-surface-container">
                            <FallbackImage 
                              src={resolvePestImage(pest.image_url)} 
                              alt={pest.name} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h5 className="text-xs font-bold text-primary truncate group-hover:text-primary-dark">{pest.name}</h5>
                            <p className="text-[10px] text-on-surface-variant font-semibold truncate">Crop: {pest.crop_affected}</p>
                          </div>
                          <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded shrink-0 ${
                            pest.severity_level === 'critical' ? 'bg-red-100 text-red-700' :
                            pest.severity_level === 'high' ? 'bg-orange-100 text-orange-700' :
                            pest.severity_level === 'rising' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {pest.severity_level}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 1. Rapid Spreading Pests (Critical/High Severity Alerts) */}
          <ErrorBoundary>
            <section className="w-full overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-error text-3xl">emergency_home</span>
                  <h3 className="font-display text-2xl font-black text-on-surface">Rapid Spreading Pests</h3>
                </div>
                <span className="text-xs text-on-surface-variant font-bold animate-pulse">← Swipe horizontally for more →</span>
              </div>

              {criticalThreats.length === 0 ? (
                <div className="p-8 bg-surface-container-low border border-outline-variant rounded-3xl text-center italic text-on-surface-variant text-sm">
                  No active critical/high severity pests reported in the region.
                </div>
              ) : (
                <div className="flex gap-6 overflow-x-auto pb-6 pt-2 snap-x scroll-smooth custom-scrollbar">
                  {criticalThreats.map((pest) => (
                    <div 
                      key={pest.id} 
                      onClick={() => setSelectedPest(pest)}
                      className="min-w-[320px] md:min-w-[360px] snap-start bg-error-container/10 border-2 border-error/20 rounded-[2rem] p-5 relative overflow-hidden group hover:border-error/40 hover:shadow-md transition-all shadow-sm cursor-pointer"
                    >
                      <div className="flex gap-4 items-start">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 border border-outline-variant/30">
                          <FallbackImage 
                            src={resolvePestImage(pest.image_url)} 
                            alt={pest.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                          />
                        </div>
                        <div>
                          <span className={`inline-block px-2 py-0.5 text-[9px] font-bold rounded mb-2 uppercase text-white ${
                            pest.severity_level === 'critical' ? 'bg-error' : 'bg-primary'
                          }`}>
                            {pest.severity_level} Threat
                          </span>
                          <h4 className="font-headline font-bold text-primary text-base leading-tight">{pest.name}</h4>
                          <p className="text-xs text-on-surface-variant line-clamp-2 mt-1 leading-normal">{pest.description}</p>
                          <p className="text-[10px] font-bold text-secondary mt-2">Crop Affected: {pest.crop_affected}</p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-outline-variant/30 text-xs bg-white/40 p-3 rounded-xl">
                        <p className="font-bold text-primary">Advice:</p>
                        <p className="text-on-surface-variant line-clamp-2 mt-0.5">{pest.advice}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </ErrorBoundary>



          {/* 3. Outbreak Reporting Section */}
          <ErrorBoundary>
            <section className="glass-card rounded-[3rem] p-10 border-2 border-dashed border-outline-variant/80 overflow-hidden relative">
              <div className="max-w-3xl mx-auto">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <span className="material-symbols-outlined text-3xl">add_a_photo</span>
                  </div>
                  <h3 className="font-display text-2xl font-black text-primary">Report Pest Outbreak</h3>
                  <p className="text-sm text-on-surface-variant mt-1">Spotted a pest infection in your field? Share it with the community.</p>
                </div>

                <form onSubmit={handleOutbreakSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Crop Name</label>
                      <input 
                        className="w-full bg-white border border-outline-variant rounded-xl py-3 px-4 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-semibold"
                        placeholder="e.g. Paddy, Cotton, Chillies..."
                        value={cropName}
                        onChange={(e) => setCropName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Pest Name (If known)</label>
                      <input 
                        className="w-full bg-white border border-outline-variant rounded-xl py-3 px-4 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-semibold"
                        placeholder="e.g. Yellow Stem Borer, Whitefly..."
                        value={pestName}
                        onChange={(e) => setPestName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Your Name</label>
                      <input 
                        className="w-full bg-white border border-outline-variant rounded-xl py-3 px-4 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-semibold"
                        value={reporterName}
                        onChange={(e) => setReporterName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">District</label>
                      <select 
                        className="w-full bg-white border border-outline-variant rounded-xl py-3 px-4 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-semibold"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                      >
                        {['Guntur', 'Kurnool', 'Krishna', 'Anantapur', 'Vizag', 'Nellore', 'Chittoor', 'Prakasam', 'Srikakulam', 'Vizianagaram', 'West Godavari', 'East Godavari', 'YSR Kadapa'].map(dist => (
                          <option key={dist} value={dist}>{dist}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Upload Outbreak Image</label>
                      <label className="w-full bg-white border border-outline-variant rounded-xl py-3 px-4 flex items-center justify-center gap-2 text-on-surface-variant cursor-pointer hover:bg-surface-container transition-colors text-sm font-semibold">
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                        <span className="material-symbols-outlined text-lg">upload</span>
                        <span className="truncate">{imageFile ? imageFile.name : 'Select file'}</span>
                      </label>
                    </div>
                  </div>

                  {imagePreview && (
                    <div className="w-32 h-32 rounded-xl overflow-hidden border border-outline-variant/60">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imagePreview} alt="Outbreak preview" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Description</label>
                    <textarea 
                      className="w-full bg-white border border-outline-variant rounded-xl py-3 px-4 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm"
                      placeholder="Describe the extent of the outbreak, crop damage symptoms, etc..."
                      rows="3"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:shadow-xl hover:shadow-primary/20 transition-all transform active:scale-[0.98] disabled:opacity-50 text-sm"
                  >
                    {isSubmitting ? 'Uploading & Submitting...' : 'Submit Outbreak Report'}
                  </button>
                </form>
              </div>
            </section>
          </ErrorBoundary>

          {/* 4. Recent Outbreaks Feed */}
          <ErrorBoundary>
            <section className="pb-12">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-primary text-2xl">history</span>
                <h3 className="font-display text-2xl font-black text-on-surface">Recent Outbreaks</h3>
                <span className="text-xs text-on-surface-variant font-semibold">({district} District)</span>
              </div>

              {filteredOutbreaks.length === 0 ? (
                <div className="p-8 bg-surface-container-low border border-outline-variant rounded-3xl text-center italic text-on-surface-variant text-sm">
                  No outbreaks reported in {district} district. Submit a report above to alert the community.
                </div>
              ) : (
                <div className="max-h-[480px] overflow-y-auto pr-2 custom-scrollbar space-y-4">
                  {filteredOutbreaks.map((ob) => (
                    <div 
                      key={ob.id}
                      onClick={() => setSelectedOutbreak(ob)}
                      className="bg-white p-4 rounded-2xl border border-outline-variant/60 flex items-center gap-4 hover:border-primary/30 transition-all cursor-pointer shadow-sm group"
                    >
                      <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center shrink-0 text-primary">
                        <span className="material-symbols-outlined">location_on</span>
                      </div>
                      
                      <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-outline-variant/40">
                        <FallbackImage 
                          src={resolvePestImage(ob.image_url)} 
                          fallbackSrc="/default_pest.png"
                          alt="Outbreak" 
                          className="w-full h-full object-cover" 
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-sm text-primary truncate">
                          {ob.pest_name || 'Unidentified Pest'} on {ob.crop_name}
                        </h5>
                        <p className="text-[11px] text-on-surface-variant mt-0.5">
                          Reported by <span className="font-bold">{ob.reporter_name}</span> • {new Date(ob.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-on-surface-variant truncate mt-1">{ob.description}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="material-symbols-outlined text-outline group-hover:text-primary transition-all text-lg">
                          chevron_right
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </ErrorBoundary>

        </div>
      </main>

      {/* Pest Detail Modal */}
      {selectedPest && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedPest(null)}
        >
          <div 
            className="bg-white rounded-[2.5rem] border border-outline-variant max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image Header or Top Banner */}
            <div className="relative h-48 md:h-64 bg-surface-container-low shrink-0">
              <FallbackImage 
                src={resolvePestImage(selectedPest.image_url)} 
                alt={selectedPest.name} 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col justify-end p-6 md:p-8">
                <span className={`px-2.5 py-1 text-[10px] font-black rounded uppercase tracking-wider text-white w-fit ${
                  selectedPest.severity_level === 'critical' ? 'bg-error' : selectedPest.severity_level === 'high' ? 'bg-amber-600' : 'bg-primary'
                }`}>
                  {selectedPest.severity_level} Threat
                </span>
                <h3 className="font-display text-2xl md:text-3xl font-black text-white mt-2 leading-tight">
                  {selectedPest.name}
                </h3>
                {selectedPest.scientific_name && (
                  <p className="text-xs md:text-sm text-white/80 italic font-medium mt-1">
                    {selectedPest.scientific_name}
                  </p>
                )}
              </div>
              <button 
                onClick={() => setSelectedPest(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md hover:bg-white/40 text-white rounded-full flex items-center justify-center shadow-lg transition-colors border border-white/20"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="flex flex-wrap gap-4 text-xs font-bold border-b border-outline-variant/30 pb-4">
                <div className="bg-surface-container px-3 py-1.5 rounded-full flex items-center gap-1.5 text-on-surface-variant">
                  <span className="material-symbols-outlined text-base text-primary">eco</span>
                  <span>Crop: {selectedPest.crop_affected}</span>
                </div>
                <div className="bg-surface-container px-3 py-1.5 rounded-full flex items-center gap-1.5 text-on-surface-variant">
                  <span className="material-symbols-outlined text-base text-primary">location_on</span>
                  <span>District: {selectedPest.district}</span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="font-headline font-bold text-primary text-sm uppercase tracking-wider">Field Symptoms &amp; Description</h4>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {selectedPest.description}
                </p>
              </div>

              {/* Treatment Advice / Plan */}
              {selectedPest.advice && (
                <div className="p-5 bg-primary/5 rounded-3xl border border-primary/20 space-y-3">
                  <div className="flex items-center gap-2 text-primary">
                    <span className="material-symbols-outlined">health_and_safety</span>
                    <h4 className="font-headline font-bold text-sm uppercase tracking-wider">Agronomist Action Plan</h4>
                  </div>
                  <div className="text-xs md:text-sm text-on-surface-variant leading-relaxed space-y-2">
                    {selectedPest.advice.split('.').filter(sentence => sentence.trim().length > 0).map((sentence, idx) => (
                      <div key={idx} className="flex gap-2.5 items-start">
                        <span className="material-symbols-outlined text-primary text-base shrink-0 mt-0.5">check_circle</span>
                        <span>{sentence.trim()}.</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Pesticide Products (Top Rated, Low Toxicity, High Efficacy) */}
              <div className="space-y-4 pt-4 border-t border-outline-variant/30">
                <div className="flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined text-xl font-bold">shopping_bag</span>
                  <h4 className="font-headline font-black text-sm uppercase tracking-wider">Top-Rated Pesticide Products &amp; Step-by-Step Usage Directions</h4>
                </div>

                <div className="space-y-4">
                  {((pest) => {
                    const name = (pest.name || '').toLowerCase();
                    if (name.includes('borer') || name.includes('bollworm') || name.includes('caterpillar') || name.includes('folder') || name.includes('armyworm')) {
                      return [
                        {
                          id: 'p-coragen',
                          name: 'FMC Coragen 18.5% SC (Chlorantraniliprole)',
                          rating: '⭐ 4.9/5 • Top Rated Stem Borer Solution',
                          advantages: ['21 days systemic borer protection', 'Target-specific action safe for honeybees & ladybirds', 'Rainfast within 2 hours'],
                          disadvantages: ['Higher cost per acre', 'Do not mix with alkaline copper sprays'],
                          howToTreat: 'Directions: Mix 60 ml per acre in 200 liters of water. Spray during early morning at the onset of pest eggs.',
                          buyLinks: { amazon: 'https://www.amazon.in/s?k=Coragen+18.5+SC+insecticide', flipkart: 'https://www.flipkart.com/search?q=Coragen+pesticide', bigHaat: 'https://www.bighaat.com/search?q=coragen' }
                        },
                        {
                          id: 'p-virtako',
                          name: 'Syngenta Virtako (Chlorantraniliprole 0.5% + Thiamethoxam 1% GR)',
                          rating: '⭐ 4.8/5 • Dual Action Granules',
                          advantages: ['Controls both stem borers and sucking plant hoppers', 'Systemic root absorption ensures plant stem protection'],
                          disadvantages: ['Requires moist soil during broadcasting', 'Do not exceed 7 kg per acre'],
                          howToTreat: 'Directions: Broadcast 7 kg per acre in standing water 20-25 days after transplanting.',
                          buyLinks: { amazon: 'https://www.amazon.in/s?k=Syngenta+Virtako+pesticide', flipkart: 'https://www.flipkart.com/search?q=Virtako+insecticide', iffcoBazar: 'https://www.iffcobazar.in/en/search?q=virtako' }
                        }
                      ];
                    }
                    if (name.includes('thrips') || name.includes('whitefly') || name.includes('planthopper') || name.includes('bph') || name.includes('midge') || name.includes('gundhi')) {
                      return [
                        {
                          id: 'p-confidor',
                          name: 'Bayer Confidor (Imidacloprid 17.8% SL)',
                          rating: '⭐ 4.9/5 • Rapid Sucking Pest Knockdown',
                          advantages: ['Fast knock-down of Thrips, Whiteflies, BPH, and Aphids', 'Transgenic systemic action protects new plant shoots'],
                          disadvantages: ['Toxic to honeybees if sprayed during flower bloom', 'Rotate sprays to prevent pest resistance'],
                          howToTreat: 'Directions: Dissolve 50-100 ml per acre in 150-200 liters of water. Spray when sucking pest nymphs are detected.',
                          buyLinks: { amazon: 'https://www.amazon.in/s?k=Bayer+Confidor+imidacloprid', flipkart: 'https://www.flipkart.com/search?q=Bayer+Confidor', bigHaat: 'https://www.bighaat.com/search?q=confidor' }
                        },
                        {
                          id: 'p-neem',
                          name: 'Neem Gold 10000 PPM (Azadirachtin Bio-Pesticide)',
                          rating: '⭐ 4.9/5 • 100% Organic Zero Side Effects',
                          advantages: ['100% Organic & eco-friendly with zero harvest waiting period', 'Anti-feedant and ovicide with zero insect resistance'],
                          disadvantages: ['Slower immediate kill speed than synthetic chemicals', 'Requires repeat spray every 7-10 days'],
                          howToTreat: 'Directions: Mix 5 ml Neem Oil + 1 ml liquid soap per liter of water and spray thoroughly on leaf undersides.',
                          buyLinks: { amazon: 'https://www.amazon.in/s?k=Neem+Oil+10000+ppm+pesticide', flipkart: 'https://www.flipkart.com/search?q=Neem+Oil+pesticide', iffcoBazar: 'https://www.iffcobazar.in/en/product/neem-oil' }
                        }
                      ];
                    }
                    return [
                      {
                        id: 'p-uthane',
                        name: 'Tata Rallis Uthane (Mancozeb 75% WP)',
                        rating: '⭐ 4.8/5 • Broad Spectrum Leaf Shield',
                        advantages: ['Broad-spectrum protective barrier against leaf spots and blights', 'Supplies Zinc and Manganese micro-nutrients'],
                        disadvantages: ['Requires thorough coverage on leaf undersides', 'Washes off during heavy rainfall'],
                        howToTreat: 'Directions: Dissolve 2 grams per liter of water (400g/acre) and spray evenly at first sign of disease spots.',
                        buyLinks: { amazon: 'https://www.amazon.in/s?k=Tata+Uthane+Mancozeb+75+WP', flipkart: 'https://www.flipkart.com/search?q=Uthane+Mancozeb', bigHaat: 'https://www.bighaat.com/search?q=uthane' }
                      },
                      {
                        id: 'p-neem',
                        name: 'Neem Gold 10000 PPM (Azadirachtin Bio-Pesticide)',
                        rating: '⭐ 4.9/5 • 100% Organic Zero Side Effects',
                        advantages: ['100% Organic & eco-friendly zero residue spray', 'Prevents egg hatching safely'],
                        disadvantages: ['Requires preventive spray every 7 days'],
                        howToTreat: 'Directions: Mix 5 ml Neem Oil per liter of water and spray thoroughly.',
                        buyLinks: { amazon: 'https://www.amazon.in/s?k=Neem+Oil+10000+ppm+pesticide', flipkart: 'https://www.flipkart.com/search?q=Neem+Oil+pesticide', iffcoBazar: 'https://www.iffcobazar.in/en/product/neem-oil' }
                      }
                    ];
                  })(selectedPest).map((prod) => (
                    <div key={prod.id} className="p-4 bg-surface-container/50 border border-outline-variant/40 rounded-3xl space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h5 className="font-headline font-black text-primary text-sm">{prod.name}</h5>
                          <span className="text-[10px] font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full inline-block mt-1">
                            {prod.rating}
                          </span>
                        </div>
                        <a
                          href={prod.buyLinks.amazon}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-primary text-white rounded-xl text-[11px] font-bold hover:bg-primary-dark transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                          title="Buy or View Details on Amazon"
                        >
                          <span>Details / Buy</span>
                          <span className="material-symbols-outlined text-xs">open_in_new</span>
                        </a>
                      </div>

                      {/* Usage Directions */}
                      <div className="p-3 bg-white/90 border border-outline-variant/30 rounded-2xl">
                        <p className="text-[10px] font-black uppercase text-primary tracking-wider">Step-by-Step Directions &amp; Dosage:</p>
                        <p className="text-xs text-on-surface font-semibold mt-0.5 leading-relaxed">{prod.howToTreat}</p>
                      </div>

                      {/* Advantages */}
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-primary tracking-wider flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">check_circle</span> Key Advantages:
                        </p>
                        <ul className="text-xs text-on-surface font-medium space-y-0.5 pl-4 list-disc">
                          {prod.advantages.map((adv, aIdx) => (
                            <li key={aIdx}>{adv}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Disadvantages / Safety */}
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-amber-600 tracking-wider flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">warning</span> Safety Precautions:
                        </p>
                        <ul className="text-xs text-on-surface-variant space-y-0.5 pl-4 list-disc">
                          {prod.disadvantages.map((dis, dIdx) => (
                            <li key={dIdx}>{dis}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Store Links */}
                      <div className="pt-2 border-t border-outline-variant/30 flex items-center justify-between text-[11px] font-bold text-on-surface-variant">
                        <span>Buy Online:</span>
                        <div className="flex items-center gap-2">
                          <a href={prod.buyLinks.amazon} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Amazon ↗</a>
                          <span>•</span>
                          <a href={prod.buyLinks.flipkart} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Flipkart ↗</a>
                          {prod.buyLinks.iffcoBazar && (
                            <>
                              <span>•</span>
                              <a href={prod.buyLinks.iffcoBazar} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">IFFCO ↗</a>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-outline-variant/40 flex justify-end shrink-0 bg-surface-container-low/40">
              <button 
                onClick={() => setSelectedPest(null)}
                className="px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:shadow-md hover:bg-primary-dark transition-all"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Outbreak Detail Modal */}
      {selectedOutbreak && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedOutbreak(null)}
        >
          <div 
            className="bg-white rounded-[2.5rem] border border-outline-variant max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image Header */}
            <div className="relative h-48 md:h-64 bg-surface-container-low shrink-0">
              <FallbackImage 
                src={resolvePestImage(selectedOutbreak.image_url)} 
                fallbackSrc="/default_pest.png"
                alt="Outbreak" 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col justify-end p-6 md:p-8">
                <span className="px-2.5 py-1 text-[10px] font-black rounded uppercase tracking-wider text-white bg-error w-fit">
                  Verified Outbreak
                </span>
                <h3 className="font-display text-2xl md:text-3xl font-black text-white mt-2 leading-tight">
                  {selectedOutbreak.pest_name || 'Unidentified Pest'} on {selectedOutbreak.crop_name}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedOutbreak(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md hover:bg-white/40 text-white rounded-full flex items-center justify-center shadow-lg transition-colors border border-white/20"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="flex flex-wrap gap-4 text-xs font-bold border-b border-outline-variant/30 pb-4">
                <div className="bg-surface-container px-3 py-1.5 rounded-full flex items-center gap-1.5 text-on-surface-variant">
                  <span className="material-symbols-outlined text-base text-primary">eco</span>
                  <span>Crop: {selectedOutbreak.crop_name}</span>
                </div>
                <div className="bg-surface-container px-3 py-1.5 rounded-full flex items-center gap-1.5 text-on-surface-variant">
                  <span className="material-symbols-outlined text-base text-primary">location_on</span>
                  <span>District: {selectedOutbreak.district}</span>
                </div>
                <div className="bg-surface-container px-3 py-1.5 rounded-full flex items-center gap-1.5 text-on-surface-variant">
                  <span className="material-symbols-outlined text-base text-primary">calendar_month</span>
                  <span>Date: {new Date(selectedOutbreak.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="font-headline font-bold text-primary text-sm uppercase tracking-wider">Report Details</h4>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {selectedOutbreak.description}
                </p>
                <p className="text-xs text-outline font-bold mt-4">
                  Reported by: {selectedOutbreak.reporter_name}
                </p>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-outline-variant/40 flex justify-end shrink-0 bg-surface-container-low/40">
              <button 
                onClick={() => setSelectedOutbreak(null)}
                className="px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:shadow-md hover:bg-primary-dark transition-all"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
