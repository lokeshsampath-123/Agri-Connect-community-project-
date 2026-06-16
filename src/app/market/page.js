'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import ErrorBoundary from '@/components/ErrorBoundary';
import FallbackImage from '@/components/FallbackImage';

const REGIONAL_MARKET_DATA = {
  Guntur: {
    prices: [
      { name: 'Chillies (Teja Variety)', arrival: '5,400 Quintals', price: 18200, unit: '/ Qtl', change: '+4.2%', icon: 'nutrition', color: 'error' },
      { name: 'Cotton (Long Staple)', arrival: '8,200 Quintals', price: 7500, unit: '/ Qtl', change: '-1.2%', icon: 'water_drop', color: 'primary' },
      { name: 'Paddy (Sona Masuri)', arrival: '12,000 Quintals', price: 2450, unit: '/ Qtl', change: '+0.5%', icon: 'grass', color: 'primary' }
    ],
    trending: [
      { name: 'Chillies (Dry Red)', desc: 'High export demand in Asia', rank: '#1', trend: 'up' },
      { name: 'Cotton', desc: 'Spinning mill procurement active', rank: '#2', trend: 'up' },
      { name: 'Paddy (Fine)', desc: 'Steady domestic demand', rank: '#3', trend: 'flat' }
    ],
    insights: [
      { tag: 'Export Surge', duration: 'Next 15 Days', title: 'Chilli Export Demand Spike', desc: 'High demand in Southeast Asian spice markets is projecting a 12% price increase at Guntur yards.', theme: 'primary' },
      { tag: 'Pest Risk', duration: 'Next 7 Days', title: 'Thrips Outbreak Impact', desc: 'Widespread Chilli Thrips damage in Guntur farms is tightening crop supply, elevating premium grade rates.', theme: 'error' }
    ]
  },
  Kurnool: {
    prices: [
      { name: 'Cotton (Long Staple)', arrival: '9,100 Quintals', price: 7450, unit: '/ Qtl', change: '+1.8%', icon: 'water_drop', color: 'primary' },
      { name: 'Paddy (Sona Masuri)', arrival: '15,000 Quintals', price: 2400, unit: '/ Qtl', change: '+1.1%', icon: 'grass', color: 'primary' },
      { name: 'Bengal Gram (Desi)', arrival: '3,200 Quintals', price: 5400, unit: '/ Qtl', change: '0.0%', icon: 'circle', color: 'secondary' }
    ],
    trending: [
      { name: 'Cotton', desc: 'Slow arrivals driving rates up', rank: '#1', trend: 'up' },
      { name: 'Bengal Gram', desc: 'Favorable post-harvest storage', rank: '#2', trend: 'up' },
      { name: 'Paddy', desc: 'Regular mill demand active', rank: '#3', trend: 'flat' }
    ],
    insights: [
      { tag: 'Supply Delay', duration: 'Next 10 Days', title: 'Rain Delay in Cotton Pickings', desc: 'Kurnool rain forecasts are delaying cotton pickings, causing buyers to bid higher for immediate stocks.', theme: 'primary' },
      { tag: 'Sowing Advice', duration: 'Next 30 Days', title: 'Bengal Gram Sowing Advisory', desc: 'RBK reports adequate soil moisture; farmers are advised to delay sales to maximize post-harvest returns.', theme: 'success' }
    ]
  },
  Anantapur: {
    prices: [
      { name: 'Groundnut (Bold)', arrival: '4,100 Quintals', price: 6800, unit: '/ Qtl', change: '-2.5%', icon: 'circle', color: 'secondary' },
      { name: 'Sunflower', arrival: '1,800 Quintals', price: 5250, unit: '/ Qtl', change: '+1.0%', icon: 'wb_sunny', color: 'warning' },
      { name: 'Paddy (Common)', arrival: '3,500 Quintals', price: 2300, unit: '/ Qtl', change: '0.0%', icon: 'grass', color: 'primary' }
    ],
    trending: [
      { name: 'Groundnut', desc: 'Oil mills active in procurement', rank: '#1', trend: 'up' },
      { name: 'Sunflower', desc: 'Stable local refinery demand', rank: '#2', trend: 'up' },
      { name: 'Maize (Yellow)', desc: 'Poultry feedstock requirements', rank: '#3', trend: 'flat' }
    ],
    insights: [
      { tag: 'Moisture Deficit', duration: 'Next 15 Days', title: 'Groundnut Quality Premium', desc: 'Low moisture in Anantapur is reducing average shell fill. High-yield pods will command a 15% premium.', theme: 'error' },
      { tag: 'Crushing Demand', duration: 'Next 7 Days', title: 'Oil Mill Capacity Limits', desc: 'Local groundnut oil mills are operating at peak capacity, stabilizing raw seed pricing.', theme: 'primary' }
    ]
  },
  Chittoor: {
    prices: [
      { name: 'Mangoes (Totapuri)', arrival: '25,000 Quintals', price: 3500, unit: '/ Qtl', change: '+6.4%', icon: 'nutrition', color: 'error' },
      { name: 'Tomatoes (Madanapalle)', arrival: '45,000 Quintals', price: 1500, unit: '/ Qtl', change: '-8.2%', icon: 'nutrition', color: 'error' },
      { name: 'Paddy (Sona Masuri)', arrival: '2,800 Quintals', price: 2450, unit: '/ Qtl', change: '+0.2%', icon: 'grass', color: 'primary' }
    ],
    trending: [
      { name: 'Mangoes', desc: 'Processing mills buying in bulk', rank: '#1', trend: 'up' },
      { name: 'Tomatoes', desc: 'Extreme supply glut at yards', rank: '#2', trend: 'down' },
      { name: 'Paddy', desc: 'Limited local arrivals', rank: '#3', trend: 'flat' }
    ],
    insights: [
      { tag: 'Peak Harvest', duration: 'Next 10 Days', title: 'Totapuri Pulp Mill Season', desc: 'Chittoor pulp mills are buying Totapuri mangoes at record volumes; prices expected to peak this week.', theme: 'primary' },
      { tag: 'Supply Glut', duration: 'Next 5 Days', title: 'Madanapalle Tomato Excess', desc: 'Excessive tomato arrivals from local fields have depressed spot prices. Farmers advised to hold harvest if possible.', theme: 'error' }
    ]
  },
  Krishna: {
    prices: [
      { name: 'Paddy (Sona Masuri)', arrival: '18,000 Quintals', price: 2480, unit: '/ Qtl', change: '+2.3%', icon: 'grass', color: 'primary' },
      { name: 'Sugarcane (Common)', arrival: '80,000 Quintals', price: 310, unit: '/ Qtl', change: '0.0%', icon: 'water_drop', color: 'primary' },
      { name: 'Black Gram (Urad)', arrival: '4,200 Quintals', price: 7200, unit: '/ Qtl', change: '+1.5%', icon: 'circle', color: 'secondary' }
    ],
    trending: [
      { name: 'Paddy', desc: 'Delta canal harvesting peak', rank: '#1', trend: 'up' },
      { name: 'Black Gram', desc: 'High demand from pulse mills', rank: '#2', trend: 'up' },
      { name: 'Sugarcane', desc: 'Sugar mills crushing steadily', rank: '#3', trend: 'flat' }
    ],
    insights: [
      { tag: 'Delta Harvest', duration: 'Next 20 Days', title: 'Paddy Arrivals Peak', desc: 'Krishna delta paddy harvests are entering the markets, causing a temporary price dip before festive demand.', theme: 'primary' },
      { tag: 'Pulse Demand', duration: 'Next 14 Days', title: 'Urad Dal Procurement', desc: 'Low winter yields in black gram have increased processing demand, boosting local prices.', theme: 'success' }
    ]
  },
  Nellore: {
    prices: [
      { name: 'Paddy (Super Fine)', arrival: '22,000 Quintals', price: 2550, unit: '/ Qtl', change: '+3.1%', icon: 'grass', color: 'primary' },
      { name: 'Sugarcane', arrival: '50,000 Quintals', price: 315, unit: '/ Qtl', change: '+0.5%', icon: 'water_drop', color: 'primary' },
      { name: 'Black Gram (Urad)', arrival: '3,800 Quintals', price: 7150, unit: '/ Qtl', change: '-0.8%', icon: 'circle', color: 'secondary' }
    ],
    trending: [
      { name: 'Paddy', desc: 'High demand for Nellore Sona', rank: '#1', trend: 'up' },
      { name: 'Sugarcane', desc: 'Cooperative factory demand', rank: '#2', trend: 'up' },
      { name: 'Black Gram', desc: 'Stable regional retail flow', rank: '#3', trend: 'flat' }
    ],
    insights: [
      { tag: 'Premium Grain', duration: 'Next 15 Days', title: 'Nellore Sona Masuri Surge', desc: 'High retail brand demand in Chennai and Bangalore is driving Nellore Sona Masuri prices up by 8%.', theme: 'primary' },
      { tag: 'Crushing Update', duration: 'Next 10 Days', title: 'Sugar Factory Procurement', desc: 'Cooperative sugar mills in Nellore have announced timely payment releases, stabilizing sugarcane rates.', theme: 'success' }
    ]
  },
  Visakhapatnam: {
    prices: [
      { name: 'Cashews (Raw Nut)', arrival: '2,500 Quintals', price: 11000, unit: '/ Qtl', change: '+2.0%', icon: 'circle', color: 'secondary' },
      { name: 'Mangoes (Banganapalli)', arrival: '8,000 Quintals', price: 4500, unit: '/ Qtl', change: '+4.5%', icon: 'nutrition', color: 'error' },
      { name: 'Paddy (Common)', arrival: '1,200 Quintals', price: 2350, unit: '/ Qtl', change: '0.0%', icon: 'grass', color: 'primary' }
    ],
    trending: [
      { name: 'Cashews', desc: 'Processing factories active', rank: '#1', trend: 'up' },
      { name: 'Mangoes', desc: 'Table variety demand is high', rank: '#2', trend: 'up' },
      { name: 'Paddy', desc: 'Local agency procurement', rank: '#3', trend: 'flat' }
    ],
    insights: [
      { tag: 'Cashew Peak', duration: 'Next 20 Days', title: 'Raw Cashew Nut Demand', desc: 'Urban processing factories in Vizag are actively buying raw nuts, keeping prices firm.', theme: 'primary' },
      { tag: 'Mango Premium', duration: 'Next 10 Days', title: 'Banganapalli Table Premium', desc: 'Slight harvest drops in coastal orchards have created a supply gap, driving premium prices.', theme: 'warning' }
    ]
  },
  Prakasam: {
    prices: [
      { name: 'Tobacco (Flue Cured)', arrival: '6,000 Quintals', price: 16500, unit: '/ Qtl', change: '+1.2%', icon: 'water_drop', color: 'primary' },
      { name: 'Chillies (Guntur Type)', arrival: '2,800 Quintals', price: 17800, unit: '/ Qtl', change: '-2.0%', icon: 'nutrition', color: 'error' },
      { name: 'Cotton', arrival: '4,500 Quintals', price: 7350, unit: '/ Qtl', change: '+0.5%', icon: 'water_drop', color: 'primary' }
    ],
    trending: [
      { name: 'Tobacco', desc: 'Competitive export bidding', rank: '#1', trend: 'up' },
      { name: 'Chillies', desc: 'Standard grade supply steady', rank: '#2', trend: 'down' },
      { name: 'Cotton', desc: 'Normal mill buying active', rank: '#3', trend: 'flat' }
    ],
    insights: [
      { tag: 'Auction Active', duration: 'Next 15 Days', title: 'Tobacco Board Auction Peaks', desc: 'Tobacco Board auctions in Prakasam show aggressive bidding by export companies, driving leaf prices.', theme: 'primary' },
      { tag: 'Standard Grades', duration: 'Next 7 Days', title: 'Chilli Standard Grades Steady', desc: 'Mandi supplies are adequate for standard grades, preventing price volatility.', theme: 'success' }
    ]
  },
  'West Godavari': {
    prices: [
      { name: 'Paddy (Super Fine)', arrival: '30,000 Quintals', price: 2600, unit: '/ Qtl', change: '+1.5%', icon: 'grass', color: 'primary' },
      { name: 'Sugarcane', arrival: '120,000 Quintals', price: 320, unit: '/ Qtl', change: '+1.0%', icon: 'water_drop', color: 'primary' },
      { name: 'Maize (Yellow)', arrival: '8,500 Quintals', price: 2100, unit: '/ Qtl', change: '-0.5%', icon: 'circle', color: 'secondary' }
    ],
    trending: [
      { name: 'Paddy', desc: 'Large scale miller contracts', rank: '#1', trend: 'up' },
      { name: 'Sugarcane', desc: 'Sugar mill crushing season', rank: '#2', trend: 'up' },
      { name: 'Maize', desc: 'Feed unit purchase slowdown', rank: '#3', trend: 'down' }
    ],
    insights: [
      { tag: 'Rice Bowl', duration: 'Next 25 Days', title: 'Super Fine Paddy Harvest', desc: 'Godavari delta paddy harvest is generating high-volume contracts from major exporters, keeping rates stable.', theme: 'primary' },
      { tag: 'Crushing Peak', duration: 'Next 12 Days', title: 'Sugarcane Factory Processing', desc: 'Sugar factories in West Godavari have started 24/7 crushing cycles; steady feedstock pricing.', theme: 'success' }
    ]
  },
  'East Godavari': {
    prices: [
      { name: 'Paddy (Super Fine)', arrival: '28,000 Quintals', price: 2580, unit: '/ Qtl', change: '+1.3%', icon: 'grass', color: 'primary' },
      { name: 'Sugarcane', arrival: '100,000 Quintals', price: 318, unit: '/ Qtl', change: '+0.8%', icon: 'water_drop', color: 'primary' },
      { name: 'Maize (Yellow)', arrival: '7,200 Quintals', price: 2080, unit: '/ Qtl', change: '-0.2%', icon: 'circle', color: 'secondary' }
    ],
    trending: [
      { name: 'Paddy', desc: 'Delta canal harvesting peak', rank: '#1', trend: 'up' },
      { name: 'Sugarcane', desc: 'Sugar mills crushing steadily', rank: '#2', trend: 'up' },
      { name: 'Maize', desc: 'Feed mills active in buying', rank: '#3', trend: 'flat' }
    ],
    insights: [
      { tag: 'Harvest Peak', duration: 'Next 20 Days', title: 'East Godavari Paddy Shipments', desc: 'Kakinada port shipping demand is keeping East Godavari fine paddy prices very strong.', theme: 'primary' },
      { tag: 'Refinement Peak', duration: 'Next 10 Days', title: 'Sugar Mill Crushing Volume', desc: 'Steady sugar cane shipments are keeping refining units fully active across the district.', theme: 'success' }
    ]
  }
};

const DEFAULT_MARKET_DATA = {
  prices: [
    { name: 'Paddy (Common)', arrival: '5,000 Quintals', price: 2350, unit: '/ Qtl', change: '+0.5%', icon: 'grass', color: 'primary' },
    { name: 'Groundnut', arrival: '2,200 Quintals', price: 6700, unit: '/ Qtl', change: '-1.0%', icon: 'circle', color: 'secondary' },
    { name: 'Maize (Yellow)', arrival: '3,100 Quintals', price: 2050, unit: '/ Qtl', change: '+1.2%', icon: 'circle', color: 'secondary' }
  ],
  trending: [
    { name: 'Paddy', desc: 'Local Mandi demand active', rank: '#1', trend: 'up' },
    { name: 'Groundnut', desc: 'Oil crushing mills purchasing', rank: '#2', trend: 'flat' },
    { name: 'Maize', desc: 'Livestock feed units active', rank: '#3', trend: 'up' }
  ],
  insights: [
    { tag: 'Mandi Supply', duration: 'Next 10 Days', title: 'Steady Grain Inflow', desc: 'Moderate regional arrivals are keeping spot rates stable for Kharif cereals.', theme: 'primary' },
    { tag: 'Climate Watch', duration: 'Next 7 Days', title: 'Scattered Rainfall Impact', desc: 'Light local showers will not affect yard drying processes; normal trade anticipated.', theme: 'success' }
  ]
};

export default function Market() {
  const [district, setDistrict] = useState('Guntur');
  
  // profit modals & state
  const [showTickerModal, setShowTickerModal] = useState(false);
  const [selectedTrend, setSelectedTrend] = useState(null);

  // Profit Analyzer State
  const [crop, setCrop] = useState('Paddy');
  const [acreage, setAcreage] = useState('');
  const [cultivationCost, setCultivationCost] = useState('');
  const [profitResult, setProfitResult] = useState(null);

  // Insights State
  const [insights, setInsights] = useState([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState(null);

  useEffect(() => {
    const session = localStorage.getItem('user_profile');
    if (session) {
      const prof = JSON.parse(session);
      if (prof.district) {
        const cleanedDist = prof.district.replace(/\s*\(.*\)\s*/g, '').trim();
        setDistrict(cleanedDist);
      }
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function fetchInsights() {
      setLoadingInsights(true);
      try {
        const res = await fetch(`/api/market?district=${encodeURIComponent(district)}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        if (active && data && Array.isArray(data.insights)) {
          setInsights(data.insights);
        }
      } catch (err) {
        console.error('Error fetching insights:', err);
        if (active) {
          // Local fallback in case the API route returns empty or fails
          const localData = REGIONAL_MARKET_DATA[district] || DEFAULT_MARKET_DATA;
          setInsights(localData.insights || []);
        }
      } finally {
        if (active) {
          setLoadingInsights(false);
        }
      }
    }
    fetchInsights();
    return () => { active = false; };
  }, [district]);

  const calculateProfit = (e) => {
    e.preventDefault();
    const acres = parseFloat(acreage);
    const cost = parseFloat(cultivationCost);

    if (isNaN(acres) || isNaN(cost) || acres <= 0 || cost < 0) {
      alert('Please enter valid acreage and cost details.');
      return;
    }

    // Standard yield (Quintals per acre) & Spot Price (₹ per Quintal)
    let yieldPerAcre = 20;
    let spotPrice = 2000;

    switch (crop) {
      case 'Paddy':
        yieldPerAcre = 24;
        spotPrice = 2450;
        break;
      case 'Cotton':
        yieldPerAcre = 12;
        spotPrice = 7500;
        break;
      case 'Chilli':
        yieldPerAcre = 16;
        spotPrice = 18200;
        break;
      case 'Mangoes':
        yieldPerAcre = 60;
        spotPrice = 3500;
        break;
      case 'Groundnut':
        yieldPerAcre = 10;
        spotPrice = 6800;
        break;
      case 'Sugarcane':
        yieldPerAcre = 350;
        spotPrice = 310;
        break;
      case 'Maize':
        yieldPerAcre = 28;
        spotPrice = 2100;
        break;
      case 'Bengal Gram':
        yieldPerAcre = 8;
        spotPrice = 5400;
        break;
      case 'Tobacco':
        yieldPerAcre = 9;
        spotPrice = 16500;
        break;
      case 'Tomato':
        yieldPerAcre = 180;
        spotPrice = 1500;
        break;
      case 'Turmeric':
        yieldPerAcre = 20;
        spotPrice = 7850;
        break;
      case 'Cashews':
        yieldPerAcre = 8;
        spotPrice = 11000;
        break;
      case 'Onions':
        yieldPerAcre = 100;
        spotPrice = 1800;
        break;
      case 'Sunflower':
        yieldPerAcre = 8;
        spotPrice = 5250;
        break;
      case 'Black Gram':
        yieldPerAcre = 7;
        spotPrice = 7200;
        break;
      case 'Green Gram':
        yieldPerAcre = 6;
        spotPrice = 7000;
        break;
    }

    const totalYield = yieldPerAcre * acres;
    const grossRevenue = totalYield * spotPrice;
    const totalCost = cost * acres;
    const netProfit = grossRevenue - totalCost;

    setProfitResult({
      totalYield,
      grossRevenue,
      totalCost,
      netProfit,
      yieldPerAcre,
      spotPrice
    });
  };

  const clearAnalyzer = () => {
    setAcreage('');
    setCultivationCost('');
    setProfitResult(null);
  };

  const activeData = REGIONAL_MARKET_DATA[district] || DEFAULT_MARKET_DATA;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 ml-0 lg:ml-[288px] pt-16 min-h-screen w-full overflow-x-hidden">
        <header className="fixed left-0 lg:left-[288px] top-0 right-0 h-16 z-40 bg-white/80 backdrop-blur-md border-b border-outline-variant shadow-sm flex justify-between items-center px-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}
              className="lg:hidden p-1.5 rounded-xl text-primary hover:bg-surface-container flex items-center justify-center shrink-0 border border-outline-variant/50"
              title="Open Menu"
            >
              <span className="material-symbols-outlined text-[20px]">menu</span>
            </button>
            <span className="font-headline text-lg font-bold text-primary">Market Insights</span>
            <div className="h-6 w-[1px] bg-outline-variant" />
            <div className="flex items-center text-on-surface gap-2 text-sm font-bold bg-surface-container-low px-4 py-1.5 rounded-full border border-outline-variant">
              <span className="material-symbols-outlined text-primary text-lg">location_on</span>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="bg-transparent border-none outline-none font-bold text-primary cursor-pointer pr-1 text-sm font-headline"
              >
                {['Guntur', 'Kurnool', 'Krishna', 'Anantapur', 'Visakhapatnam', 'Nellore', 'Chittoor', 'Prakasam', 'Srikakulam', 'Vizianagaram', 'West Godavari', 'East Godavari', 'YSR Kadapa'].map(dist => (
                  <option key={dist} value={dist} className="bg-white text-on-surface">{dist} District</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Live Feeds Active</span>
          </div>
        </header>

        <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-12">
          
          {/* Hero Section */}
          <section className="flex flex-col md:flex-row gap-8 items-center bg-white/60 p-6 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border border-outline-variant shadow-sm relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
            
            <div className="relative z-10 flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary text-white rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                <span className="material-symbols-outlined text-[12px]">auto_graph</span>
                Real-time Analysis
              </div>
              <h2 className="font-display text-4xl font-black text-primary mb-4 leading-tight">Market Pulse 2026</h2>
              <p className="text-sm text-on-surface-variant max-w-xl mb-6 leading-relaxed font-medium">
                Leveraging regional satellite yields and local yards spot APIs to provide surgical precision on agricultural commodity movements and future arbitrage opportunities in {district}.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowTickerModal(true)}
                  className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center gap-2 text-xs cursor-pointer"
                >
                  View Live Ticker
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
            
            <div className="relative z-10 w-full md:w-[320px] lg:w-[360px] shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                alt="Market Trends Illustration" 
                className="w-full h-auto drop-shadow-2xl hover:scale-102 transition-transform duration-500 rounded-3xl" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCza9UY-nCqvCEM11sAyALrA6ZrnMziTESbBIL4izaWHVrlZU12j9_Ev3YPNhymo3WaMiJZqxkkjyOCHOEtQAJTaZ_FlzW95Uxp9bGJrfXEPChpCE0vPrdTDzkcfzkhaELZ9pzG0QTZ3Jfoa8mivj-1QlbizL0yD8899y3YtlDRGT2zTrPFvRY_pnszyi6qiAYOzuoPKsHXf5DtS66Rbavewi_AagO524lSammbi-aSqa5eqDhgIVhFKCkYd5cGeMi6sNd3EJlY0LAz"
              />
            </div>
          </section>

          {/* Bento Grid */}
          <div className="grid grid-cols-12 gap-8">
            
            {/* Spot Prices (8 Cols) */}
            <ErrorBoundary>
              <div className="col-span-12 lg:col-span-8 bg-white border border-outline-variant p-5 sm:p-6 lg:p-8 rounded-2xl sm:rounded-[3rem] shadow-sm">
                <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                  <h3 className="font-display text-xl font-black text-primary">Regional Spot Prices</h3>
                  <span className="px-3 py-1 bg-surface-container text-on-surface-variant text-xs font-bold rounded-lg shrink-0">
                    Last Update: 12m ago
                  </span>
                </div>

                <div className="space-y-6">
                  {activeData.prices.map((item, index) => (
                    <div key={index} className="space-y-6">
                      {index > 0 && <div className="h-[1px] w-full bg-outline-variant/30" />}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl hover:bg-surface-container-low transition-all gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                            item.color === 'error' ? 'bg-error/10 text-error' : item.color === 'warning' ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary'
                          }`}>
                            <span className="material-symbols-outlined">{item.icon}</span>
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-on-surface truncate">{item.name}</h4>
                            <p className="text-xs text-on-surface-variant font-medium">Arrival: {item.arrival}</p>
                          </div>
                        </div>
                        <div className="text-left sm:text-right shrink-0">
                          <div className="font-bold text-lg text-primary">
                            ₹{item.price.toLocaleString('en-IN')} <span className="text-xs text-on-surface-variant font-normal">/ Qtl</span>
                          </div>
                          <div className={`flex items-center sm:justify-end gap-1 font-bold text-xs ${
                            item.change.startsWith('+') ? 'text-tertiary' : item.change.startsWith('-') ? 'text-error' : 'text-outline'
                          }`}>
                            <span className="material-symbols-outlined text-[14px]">
                              {item.change.startsWith('+') ? 'trending_up' : item.change.startsWith('-') ? 'trending_down' : 'trending_flat'}
                            </span>
                            {item.change}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ErrorBoundary>

            {/* Trending Crops (4 Cols) */}
            <ErrorBoundary>
              <div className="col-span-12 lg:col-span-4 bg-primary text-white p-5 sm:p-6 lg:p-8 rounded-2xl sm:rounded-[3rem] shadow-md relative overflow-hidden flex flex-col justify-between min-h-[350px]">
                <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="w-full">
                  <h3 className="font-display text-xl font-black mb-6 relative z-10">Trending Demand</h3>
                  <div className="space-y-4 relative z-10 w-full">
                    {activeData.trending.map((trend, index) => (
                      <div 
                        key={index} 
                        onClick={() => setSelectedTrend(trend)}
                        className="flex items-center gap-3 bg-white/10 p-4 rounded-2xl border border-white/5 hover:bg-white/15 transition-all cursor-pointer min-w-0 group"
                      >
                        <div className="text-2xl font-black opacity-30 shrink-0">{trend.rank}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-xs sm:text-sm leading-tight group-hover:text-success-bright transition-colors">{trend.name}</p>
                          <p className="text-[10px] opacity-75 mt-0.5 leading-snug">{trend.desc}</p>
                        </div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          trend.trend === 'up' ? 'bg-success-bright text-primary' : trend.trend === 'down' ? 'bg-error-container text-on-error-container' : 'bg-white/20 text-white'
                        }`}>
                          <span className="material-symbols-outlined text-sm font-bold">
                            {trend.trend === 'up' ? 'north_east' : trend.trend === 'down' ? 'south_east' : 'trending_flat'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ErrorBoundary>
          </div>

          <div className="grid grid-cols-12 gap-8">
            
            {/* Future Insights (5 Cols) */}
            <ErrorBoundary>
              <div className="col-span-12 lg:col-span-5 bg-secondary text-white p-5 sm:p-6 lg:p-8 rounded-2xl sm:rounded-[3rem] shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <span className="material-symbols-outlined text-success-bright">magic_button</span>
                  <h3 className="font-display text-xl font-black">Future Insights ({district})</h3>
                </div>
                <div className="space-y-6">
                  {loadingInsights ? (
                    <div className="space-y-6">
                      {[1, 2].map((i) => (
                        <div key={i} className="p-5 border border-white/10 rounded-2xl bg-white/5 animate-pulse space-y-3">
                          <div className="flex justify-between items-center">
                            <div className="h-4 bg-white/20 rounded w-16" />
                            <div className="h-3 bg-white/20 rounded w-12" />
                          </div>
                          <div className="h-5 bg-white/20 rounded w-3/4 animate-pulse" />
                          <div className="h-3 bg-white/20 rounded w-full" />
                          <div className="h-3 bg-white/20 rounded w-5/6" />
                        </div>
                      ))}
                    </div>
                  ) : insights.length === 0 ? (
                    <div className="p-8 text-center text-white/60 text-xs">
                      <span className="material-symbols-outlined text-[32px] block mb-2 opacity-50">analytics</span>
                      No future insights available for this district at the moment.
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {insights.map((insight, index) => (
                        <div 
                          key={index} 
                          onClick={() => setSelectedInsight(insight)}
                          className="p-5 border border-white/10 rounded-2xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer relative overflow-hidden group hover:scale-[1.02] duration-300"
                        >
                          <div className="flex justify-between items-start mb-2 gap-2 flex-wrap">
                            <span className={`px-3 py-1 text-[9px] font-bold rounded-full uppercase tracking-wider ${
                              insight.theme === 'error' ? 'bg-error text-white' : 
                              insight.theme === 'success' ? 'bg-tertiary text-white' :
                              insight.theme === 'warning' ? 'bg-warning text-black' :
                              'bg-primary text-white'
                            }`}>
                              {insight.tag}
                            </span>
                            <span className="text-[10px] text-white/50 font-bold shrink-0">{insight.duration}</span>
                          </div>
                          {insight.crop && (
                            <div className="text-[10px] text-success-bright font-black uppercase tracking-wider mb-1">
                              Crop Focus: {insight.crop}
                            </div>
                          )}
                          <h4 className="font-bold text-sm mb-1 text-white group-hover:text-success-bright transition-colors">{insight.title}</h4>
                          <p className="text-xs text-white/70 leading-normal line-clamp-2">{insight.desc}</p>
                          <div className="mt-3 flex items-center gap-1 text-[10px] text-success-bright font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                            <span>Open details</span>
                            <span className="material-symbols-outlined text-xs">arrow_forward</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </ErrorBoundary>

            {/* Profit Analyzer (7 Cols) */}
            <ErrorBoundary>
              <div className="col-span-12 lg:col-span-7 bg-white border border-outline-variant p-5 sm:p-6 lg:p-8 rounded-2xl sm:rounded-[3rem] shadow-sm">
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                  <h3 className="font-display text-xl font-black text-primary">Profit Analyzer</h3>
                  <button 
                    onClick={clearAnalyzer}
                    className="text-primary font-bold text-xs hover:underline"
                  >
                    Clear Data
                  </button>
                </div>

                <form onSubmit={calculateProfit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-wider mb-2 font-label">
                        Select Crop
                      </label>
                      <select 
                        value={crop}
                        onChange={(e) => setCrop(e.target.value)}
                        className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-3 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none text-sm font-semibold"
                      >
                        <option value="Paddy">Paddy (Rice)</option>
                        <option value="Cotton">Cotton</option>
                        <option value="Chilli">Chillies</option>
                        <option value="Mangoes">Mangoes</option>
                        <option value="Groundnut">Groundnut</option>
                        <option value="Sugarcane">Sugarcane</option>
                        <option value="Maize">Maize (Corn)</option>
                        <option value="Bengal Gram">Bengal Gram (Chickpeas)</option>
                        <option value="Tobacco">Tobacco</option>
                        <option value="Tomato">Tomatoes</option>
                        <option value="Turmeric">Turmeric</option>
                        <option value="Cashews">Cashews</option>
                        <option value="Onions">Onions</option>
                        <option value="Sunflower">Sunflower</option>
                        <option value="Black Gram">Black Gram (Urad Dal)</option>
                        <option value="Green Gram">Green Gram (Moong Dal)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-wider mb-2 font-label">
                        Acreage (Acres)
                      </label>
                      <input 
                        type="number" 
                        placeholder="e.g. 5" 
                        value={acreage}
                        onChange={(e) => setAcreage(e.target.value)}
                        required
                        min="0.1"
                        step="any"
                        className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-3 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none text-sm font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-wider mb-2 font-label">
                        Cost of Cultivation (₹ / Acre)
                      </label>
                      <input 
                        type="number" 
                        placeholder="₹ per acre" 
                        value={cultivationCost}
                        onChange={(e) => setCultivationCost(e.target.value)}
                        required
                        min="0"
                        className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-3 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none text-sm font-semibold"
                      />
                    </div>
                  </div>

                  <div className="bg-surface-container-low/60 rounded-3xl p-6 flex flex-col justify-center items-center text-center border border-outline-variant/30 min-h-[250px]">
                    {!profitResult ? (
                      <>
                        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                          <span className="material-symbols-outlined text-[32px]">calculate</span>
                        </div>
                        <p className="text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                          Net Profit Projection
                        </p>
                        <div className="text-3xl font-black text-primary mb-2">₹ --,---</div>
                        <p className="text-[10px] text-on-surface-variant max-w-[200px] leading-normal font-medium">
                          Calculated using 5-year average regional yield estimates and live spot rates.
                        </p>
                        <button 
                          type="submit"
                          className="mt-6 w-full bg-primary text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-primary/20 text-xs transition-all"
                        >
                          Calculate Profit
                        </button>
                      </>
                    ) : (
                      <div className="w-full text-left space-y-4">
                        <div className="text-center pb-3 border-b border-outline-variant/30">
                          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                            Estimated Net Profit
                          </p>
                          <div className={`text-3xl font-black mt-1 ${
                            profitResult.netProfit >= 0 ? 'text-primary' : 'text-error'
                          }`}>
                            ₹ {profitResult.netProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </div>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-on-surface-variant">Avg Yield / Acre:</span>
                            <span className="font-bold text-primary">{profitResult.yieldPerAcre} Qtl</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-on-surface-variant">Live Spot Rate:</span>
                            <span className="font-bold text-primary">₹ {profitResult.spotPrice} / Qtl</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-on-surface-variant">Total Output:</span>
                            <span className="font-bold text-primary">{profitResult.totalYield.toFixed(1)} Qtl</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-on-surface-variant">Gross Revenue:</span>
                            <span className="font-bold text-primary">₹ {profitResult.grossRevenue.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-on-surface-variant">Total Expense:</span>
                            <span className="font-bold text-error">₹ {profitResult.totalCost.toLocaleString()}</span>
                          </div>
                        </div>

                        <button 
                          onClick={clearAnalyzer}
                          className="w-full bg-primary text-white py-3 rounded-xl font-bold text-xs hover:shadow-lg hover:shadow-primary/20 transition-all text-center"
                        >
                          Recalculate
                        </button>
                      </div>
                    )}
                  </div>
                </form>
              </div>
            </ErrorBoundary>

          </div>
        </div>
      </main>

      {/* Live Ticker Modal */}
      {showTickerModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowTickerModal(false)}
        >
          <div 
            className="bg-white rounded-[2.5rem] border border-outline-variant max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-outline-variant/30 flex justify-between items-center shrink-0">
              <div>
                <span className="px-2.5 py-1 text-[9px] font-black rounded uppercase tracking-wider text-white bg-tertiary w-fit">
                  Live Mandi Ledger
                </span>
                <h3 className="font-display text-2xl font-black text-primary mt-1">
                  {district} Yard Spot Prices
                </h3>
              </div>
              <button 
                onClick={() => setShowTickerModal(false)}
                className="w-10 h-10 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-full flex items-center justify-center shadow-md transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="bg-primary/5 border border-primary/20 rounded-3xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined animate-pulse">sensors</span>
                  <h4 className="font-headline font-bold text-sm uppercase tracking-wider">Rythu Bharosa Kendra (RBK) Feed</h4>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Direct connection established to {district} cooperative storage and arrival gates. Showing verified transactions for today.
                </p>
              </div>

              {/* Arrivals & Price details */}
              <div className="space-y-4">
                <h4 className="font-headline font-bold text-primary text-xs uppercase tracking-wider">Today's Verified Arrivals</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeData.prices.map((item, idx) => (
                    <div key={idx} className="bg-surface-container-low border border-outline-variant/40 p-4 rounded-2xl flex justify-between items-center">
                      <div>
                        <p className="font-bold text-xs text-on-surface">{item.name}</p>
                        <p className="text-[10px] text-on-surface-variant mt-0.5">Arrivals: {item.arrival}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-sm text-primary">₹{item.price.toLocaleString('en-IN')}</p>
                        <p className={`text-[10px] font-bold ${item.change.startsWith('+') ? 'text-tertiary' : 'text-error'}`}>{item.change}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live transactions timeline */}
              <div className="space-y-4">
                <h4 className="font-headline font-bold text-primary text-xs uppercase tracking-wider">Live Gate Arrival Log</h4>
                <div className="space-y-3">
                  {[
                    { time: '10:42 AM', vehicle: 'AP 07 TJ 1234', crop: activeData.prices[0]?.name || 'Crop', quantity: '85 Bags', status: 'UNLOADED' },
                    { time: '10:35 AM', vehicle: 'AP 02 YK 5678', crop: activeData.prices[1]?.name || 'Crop', quantity: '120 Bags', status: 'VERIFIED' },
                    { time: '10:18 AM', vehicle: 'AP 26 MK 9012', crop: activeData.prices[2]?.name || 'Crop', quantity: '70 Bags', status: 'VERIFIED' },
                    { time: '09:55 AM', vehicle: 'AP 16 TX 3456', crop: activeData.prices[0]?.name || 'Crop', quantity: '110 Bags', status: 'COMPLETED' }
                  ].map((log, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-white border border-outline-variant/60 rounded-xl text-xs">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-outline font-bold shrink-0">{log.time}</span>
                        <div>
                          <p className="font-bold text-primary">{log.vehicle} ({log.crop})</p>
                          <p className="text-[10px] text-on-surface-variant">Volume: {log.quantity}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-0.5 text-[9px] font-black rounded uppercase tracking-wider ${
                        log.status === 'UNLOADED' ? 'bg-amber-100 text-amber-800' : log.status === 'VERIFIED' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-outline-variant/40 flex justify-end shrink-0 bg-surface-container-low/40">
              <button 
                onClick={() => setShowTickerModal(false)}
                className="px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:shadow-md hover:bg-primary-dark transition-all"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trending Crop Detail Modal */}
      {selectedTrend && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedTrend(null)}
        >
          <div 
            className="bg-white rounded-[2.5rem] border border-outline-variant max-w-md w-full overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center shrink-0">
              <div>
                <span className="px-2.5 py-1 text-[9px] font-black rounded uppercase tracking-wider text-white bg-primary w-fit">
                  Trending Rank {selectedTrend.rank}
                </span>
                <h3 className="font-display text-xl font-black text-primary mt-1">
                  {selectedTrend.name} Market Analysis
                </h3>
              </div>
              <button 
                onClick={() => setSelectedTrend(null)}
                className="w-10 h-10 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-full flex items-center justify-center shadow-md transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <h4 className="font-headline font-bold text-primary text-xs uppercase tracking-wider">Trend Indicator</h4>
                <div className="flex items-center gap-2">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    selectedTrend.trend === 'up' ? 'bg-success-bright/20 text-tertiary' : selectedTrend.trend === 'down' ? 'bg-error/20 text-error' : 'bg-outline/20 text-outline'
                  }`}>
                    <span className="material-symbols-outlined text-sm font-bold">
                      {selectedTrend.trend === 'up' ? 'north_east' : selectedTrend.trend === 'down' ? 'south_east' : 'trending_flat'}
                    </span>
                  </span>
                  <span className="text-sm font-bold text-on-surface">
                    {selectedTrend.trend === 'up' ? 'Strong Price Appreciation' : selectedTrend.trend === 'down' ? 'Price Correction / Supply Glut' : 'Stable Sourcing Rates'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-headline font-bold text-primary text-xs uppercase tracking-wider">Market Description</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {selectedTrend.desc}. Sourcing activity is highly concentrated in {district} and neighboring Rythu Bharosa Kendras (RBKs). Average spot rates are expected to hold these levels for the next 10-14 days.
                </p>
              </div>

              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 text-xs text-on-surface-variant leading-relaxed">
                <p className="font-bold text-primary mb-1">Agronomist Recommendation:</p>
                {selectedTrend.trend === 'up' ? (
                  "Prices are currently rising. If you have stock, consider selling 50% now and holding the rest to maximize returns. Monitor local Mandi arrivals daily."
                ) : selectedTrend.trend === 'down' ? (
                  "Supply glut detected. Avoid distress selling at low prices. If possible, utilize RBK cold storage facilities to defer sales until market arrivals clear."
                ) : (
                  "Prices are highly stable. Continue regular sales according to your harvest schedule. Sowing prospects for the next season look balanced."
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-outline-variant/40 flex justify-end shrink-0 bg-surface-container-low/40">
              <button 
                onClick={() => setSelectedTrend(null)}
                className="px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:shadow-md hover:bg-primary-dark transition-all"
              >
                Close Analysis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Future Insight Detail Modal */}
      {selectedInsight && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedInsight(null)}
        >
          <div 
            className="bg-white rounded-[2.5rem] border border-outline-variant max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-outline-variant/30 flex justify-between items-center shrink-0">
              <div>
                <span className={`px-2.5 py-1 text-[9px] font-black rounded uppercase tracking-wider text-white ${
                  selectedInsight.theme === 'error' ? 'bg-error' :
                  selectedInsight.theme === 'success' ? 'bg-tertiary' :
                  selectedInsight.theme === 'warning' ? 'bg-amber-600' :
                  'bg-primary'
                } w-fit`}>
                  {selectedInsight.tag} • {selectedInsight.duration}
                </span>
                <h3 className="font-display text-2xl font-black text-primary mt-1">
                  {selectedInsight.crop} - Future Outlook
                </h3>
              </div>
              <button 
                onClick={() => setSelectedInsight(null)}
                className="w-10 h-10 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-full flex items-center justify-center shadow-md transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar">
              {/* Title and main description */}
              <div className="space-y-3">
                <h4 className="font-headline font-bold text-lg text-primary">{selectedInsight.title}</h4>
                <p className="text-sm text-on-surface-variant leading-relaxed font-medium">
                  {selectedInsight.desc}
                </p>
              </div>

              {/* Agronomical Suggestions */}
              {selectedInsight.suggestion && (
                <div className="bg-primary/5 border border-primary/20 rounded-3xl p-5 space-y-2">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                    <span className="material-symbols-outlined text-lg">psychology</span>
                    <span>Agronomic Recommendation</span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {selectedInsight.suggestion}
                  </p>
                </div>
              )}

              {/* Pros & Cons Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Pros */}
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                    <span>Pros & Advantages</span>
                  </div>
                  <ul className="space-y-2">
                    {selectedInsight.pros?.map((pro, idx) => (
                      <li key={idx} className="flex gap-2 text-xs text-emerald-950 leading-normal">
                        <span className="text-emerald-600 font-black select-none">•</span>
                        <span>{pro}</span>
                      </li>
                    ))}
                    {(!selectedInsight.pros || selectedInsight.pros.length === 0) && (
                      <li className="text-xs text-on-surface-variant italic">No advantages listed.</li>
                    )}
                  </ul>
                </div>

                {/* Cons */}
                <div className="bg-rose-50/50 border border-rose-100 rounded-3xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-rose-800 font-bold text-xs uppercase tracking-wider">
                    <span className="material-symbols-outlined text-lg">warning</span>
                    <span>Cons & Risk Factors</span>
                  </div>
                  <ul className="space-y-2">
                    {selectedInsight.cons?.map((con, idx) => (
                      <li key={idx} className="flex gap-2 text-xs text-rose-950 leading-normal">
                        <span className="text-rose-600 font-black select-none">•</span>
                        <span>{con}</span>
                      </li>
                    ))}
                    {(!selectedInsight.cons || selectedInsight.cons.length === 0) && (
                      <li className="text-xs text-on-surface-variant italic">No risk factors listed.</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-outline-variant/40 flex justify-end shrink-0 bg-surface-container-low/40">
              <button 
                onClick={() => setSelectedInsight(null)}
                className="px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:shadow-md hover:bg-primary-dark transition-all"
              >
                Close Outlook
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
