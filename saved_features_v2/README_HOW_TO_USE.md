# Saved Features Backup & Upgrade Package (v2)

This folder contains all the newly built features safely backed up so they do not alter your main website until you choose to activate them.

## Included Files & Features:

1. **`soil_page_predictive.js`**
   - Interactive Soil Overview UI with 1-Week, 1-Month, and 1-Year predictive timeline tabs.
   - Recommended Pesticides & Soil Amendment Product cards with Buy/Details buttons.

2. **`soil_api_route.js`**
   - Dataset processing backend matching the 500 AP soil dataset samples across all AP districts.
   - Computes unique statistical averages, Soil Quality Index (SQI), and multi-stage 1W/1M/1Y forecasts.

3. **`pests_page_dialog.js`**
   - Pest Tracker with click-to-open modal dialogs for any searched crop/pest.
   - Includes top-rated, high-efficacy pesticide product recommendations, step-by-step usage directions, pros/cons, and direct e-commerce links (Amazon, Flipkart, IFFCO Bazar, BigHaat).

4. **`client_layout_helper.js`**
   - Audio TTS assistant with **Read Aloud (Full Page)** mode (excluding sidebars & icons) and **Select Text** mode.

5. **`soil_dataset.json`**
   - Parsed JSON containing all 500 soil sample records.

## How to Activate in Main Website:

- Copy `soil_page_predictive.js` to `src/app/soil/page.js`
- Copy `soil_api_route.js` to `src/app/api/soil/route.js`
- Copy `pests_page_dialog.js` to `src/app/pests/page.js`
- Copy `client_layout_helper.js` to `src/app/client-layout-helper.js`
- Copy `soil_dataset.json` to `src/data/soil_dataset.json`
