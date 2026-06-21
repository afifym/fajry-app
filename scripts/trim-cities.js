#!/usr/bin/env node
// One-off script to generate assets/cities.json from all-the-cities.
// Filters to cities with population >= 15000 to stay under 1MB.
// Run with: node scripts/trim-cities.js

const cities = require('all-the-cities');
const fs = require('fs');
const path = require('path');

const MIN_POPULATION = 40000;

const trimmed = cities
  .filter((c) => c.population >= MIN_POPULATION)
  .map((c) => ({
    name: c.name,
    country: c.country,
    // GeoJSON coordinates are [lng, lat]
    lat: c.loc.coordinates[1],
    lng: c.loc.coordinates[0],
  }));

const outPath = path.join(__dirname, '..', 'assets', 'cities.json');
fs.writeFileSync(outPath, JSON.stringify(trimmed));

const bytes = fs.statSync(outPath).size;
console.log(`Written ${trimmed.length} cities to assets/cities.json (${(bytes / 1024).toFixed(1)} KB)`);
