export const CROP_ASSETS = {
  paddy: {
    id: 'paddy',
    name: 'Paddy (Rice)',
    url: 'https://images.unsplash.com/photo-1536882240095-0379873feb4e?q=80&w=400'
  },
  cotton: {
    id: 'cotton',
    name: 'Cotton',
    url: 'https://images.unsplash.com/photo-1594900010978-8f9f0f9b60e6?q=80&w=400'
  },
  chillies: {
    id: 'chillies',
    name: 'Chillies',
    url: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?q=80&w=400'
  },
  mangoes: {
    id: 'mangoes',
    name: 'Mangoes',
    url: 'https://images.unsplash.com/photo-1553279768-865429fa0078?q=80&w=400'
  },
  groundnut: {
    id: 'groundnut',
    name: 'Groundnut',
    url: 'https://images.unsplash.com/photo-1598970434796-0f2c4167e41b?q=80&w=400'
  },
  sugarcane: {
    id: 'sugarcane',
    name: 'Sugarcane',
    url: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?q=80&w=400'
  },
  maize: {
    id: 'maize',
    name: 'Maize (Corn)',
    url: 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?q=80&w=400'
  },
  bengal_gram: {
    id: 'bengal_gram',
    name: 'Bengal Gram (Chickpeas)',
    url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=400'
  },
  tobacco: {
    id: 'tobacco',
    name: 'Tobacco',
    url: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=400'
  },
  tomatoes: {
    id: 'tomatoes',
    name: 'Tomatoes',
    url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?q=80&w=400'
  },
  turmeric: {
    id: 'turmeric',
    name: 'Turmeric',
    url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?q=80&w=400'
  },
  cashews: {
    id: 'cashews',
    name: 'Cashews',
    url: 'https://images.unsplash.com/photo-1508061253366-f7da158b6d4f?q=80&w=400'
  },
  onions: {
    id: 'onions',
    name: 'Onions',
    url: 'https://images.unsplash.com/photo-1508747703725-719ae25d3d1a?q=80&w=400'
  },
  sunflower: {
    id: 'sunflower',
    name: 'Sunflower',
    url: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?q=80&w=400'
  },
  black_gram: {
    id: 'black_gram',
    name: 'Black Gram (Urad Dal)',
    url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=400'
  },
  green_gram: {
    id: 'green_gram',
    name: 'Green Gram (Moong Dal)',
    url: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?q=80&w=400'
  }
};

export const PEST_ASSETS = {
  yellow_stem_borer: 'https://images.unsplash.com/photo-1600158615171-823cc7c13dbe?q=80&w=400',
  pink_bollworm: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?q=80&w=400',
  chilli_thrips: 'https://images.unsplash.com/photo-1628352611411-0e11a1820468?q=80&w=400',
  tobacco_caterpillar: 'https://images.unsplash.com/photo-1475113548554-5a36f1f523d6?q=80&w=400',
  whitefly: 'https://images.unsplash.com/photo-1507005990249-17c24148b294?q=80&w=400',
  brown_plant_hopper: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?q=80&w=400',
  early_shoot_borer: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?q=80&w=400',
  leaf_folder: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=400',
  groundnut_leaf_miner: 'https://images.unsplash.com/photo-1598970434796-0f2c4167e41b?q=80&w=400',
  red_hairy_caterpillar: 'https://images.unsplash.com/photo-1569974498991-d3c12a504f95?q=80&w=400'
};

/**
 * Returns a high-fidelity image URL for the given asset key,
 * resolving to a library image or returning a safe fallback.
 */
export function getAssetUrl(key, type = 'crop') {
  if (!key) return null;
  
  const normalizedKey = key.toLowerCase().replace(/[\s\-_]+/g, '_');
  
  if (type === 'crop' && CROP_ASSETS[normalizedKey]) {
    return CROP_ASSETS[normalizedKey].url;
  }
  if (type === 'pest' && PEST_ASSETS[normalizedKey]) {
    return PEST_ASSETS[normalizedKey];
  }
  return null;
}
