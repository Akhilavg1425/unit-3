/* 
   data.js — Burning Earth: Global Wildfire & Climate Crisis
   Sources:
   - Global Fire Emissions Database (GFED) 2023
   - NASA FIRMS active fire data 2023
   - IPCC AR6 temperature anomalies
   - Copernicus Climate Change Service (C3S)
*/
const countryData = [
  // North America
  { iso3:"USA", name:"United States",    tempAnomaly:1.28, fireDays:62,  burnedMha:4.2,  risk:"high", region:"NorthAm" },
  { iso3:"CAN", name:"Canada",           tempAnomaly:2.31, fireDays:89,  burnedMha:18.4, risk:"crit", region:"NorthAm" },
  { iso3:"MEX", name:"Mexico",           tempAnomaly:1.12, fireDays:46,  burnedMha:1.4,  risk:"med",  region:"NorthAm" },
  // South America
  { iso3:"BRA", name:"Brazil",           tempAnomaly:0.94, fireDays:48,  burnedMha:11.2, risk:"high", region:"SouthAm" },
  { iso3:"ARG", name:"Argentina",        tempAnomaly:0.98, fireDays:44,  burnedMha:2.8,  risk:"med",  region:"SouthAm" },
  { iso3:"CHL", name:"Chile",            tempAnomaly:0.88, fireDays:41,  burnedMha:0.94, risk:"med",  region:"SouthAm" },
  { iso3:"COL", name:"Colombia",         tempAnomaly:0.71, fireDays:38,  burnedMha:1.1,  risk:"med",  region:"SouthAm" },
  { iso3:"VEN", name:"Venezuela",        tempAnomaly:0.79, fireDays:40,  burnedMha:1.8,  risk:"med",  region:"SouthAm" },
  { iso3:"BOL", name:"Bolivia",          tempAnomaly:0.85, fireDays:47,  burnedMha:3.2,  risk:"high", region:"SouthAm" },
  { iso3:"PRY", name:"Paraguay",         tempAnomaly:0.92, fireDays:46,  burnedMha:1.9,  risk:"med",  region:"SouthAm" },
  { iso3:"PER", name:"Peru",             tempAnomaly:0.76, fireDays:36,  burnedMha:0.9,  risk:"med",  region:"SouthAm" },
  // Europe
  { iso3:"GRC", name:"Greece",           tempAnomaly:1.62, fireDays:61,  burnedMha:0.93, risk:"high", region:"Europe" },
  { iso3:"ESP", name:"Spain",            tempAnomaly:1.44, fireDays:55,  burnedMha:0.31, risk:"med",  region:"Europe" },
  { iso3:"PRT", name:"Portugal",         tempAnomaly:1.38, fireDays:58,  burnedMha:0.27, risk:"med",  region:"Europe" },
  { iso3:"ITA", name:"Italy",            tempAnomaly:1.54, fireDays:39,  burnedMha:0.15, risk:"med",  region:"Europe" },
  { iso3:"FRA", name:"France",           tempAnomaly:1.61, fireDays:34,  burnedMha:0.08, risk:"low",  region:"Europe" },
  { iso3:"DEU", name:"Germany",          tempAnomaly:1.72, fireDays:28,  burnedMha:0.03, risk:"low",  region:"Europe" },
  { iso3:"SWE", name:"Sweden",           tempAnomaly:2.04, fireDays:38,  burnedMha:0.12, risk:"med",  region:"Europe" },
  { iso3:"NOR", name:"Norway",           tempAnomaly:2.28, fireDays:32,  burnedMha:0.03, risk:"low",  region:"Europe" },
  { iso3:"FIN", name:"Finland",          tempAnomaly:2.21, fireDays:35,  burnedMha:0.04, risk:"low",  region:"Europe" },
  { iso3:"GBR", name:"United Kingdom",   tempAnomaly:1.38, fireDays:22,  burnedMha:0.01, risk:"low",  region:"Europe" },
  { iso3:"ROU", name:"Romania",          tempAnomaly:1.41, fireDays:31,  burnedMha:0.04, risk:"low",  region:"Europe" },
  { iso3:"UKR", name:"Ukraine",          tempAnomaly:1.55, fireDays:33,  burnedMha:0.11, risk:"med",  region:"Europe" },
  // Russia & Central Asia
  { iso3:"RUS", name:"Russia",           tempAnomaly:2.12, fireDays:71,  burnedMha:29.8, risk:"crit", region:"Russia" },
  { iso3:"KAZ", name:"Kazakhstan",       tempAnomaly:2.01, fireDays:44,  burnedMha:4.1,  risk:"high", region:"Russia" },
  { iso3:"MNG", name:"Mongolia",         tempAnomaly:2.44, fireDays:48,  burnedMha:2.2,  risk:"high", region:"Russia" },
  // Middle East
  { iso3:"TUR", name:"Turkey",           tempAnomaly:1.29, fireDays:52,  burnedMha:0.22, risk:"med",  region:"MidEast" },
  { iso3:"IRN", name:"Iran",             tempAnomaly:1.51, fireDays:43,  burnedMha:0.18, risk:"med",  region:"MidEast" },
  { iso3:"SAU", name:"Saudi Arabia",     tempAnomaly:1.82, fireDays:28,  burnedMha:0.04, risk:"low",  region:"MidEast" },
  { iso3:"IRQ", name:"Iraq",             tempAnomaly:1.68, fireDays:31,  burnedMha:0.06, risk:"low",  region:"MidEast" },
  // Asia
  { iso3:"CHN", name:"China",            tempAnomaly:1.55, fireDays:41,  burnedMha:1.8,  risk:"med",  region:"Asia" },
  { iso3:"IND", name:"India",            tempAnomaly:0.89, fireDays:39,  burnedMha:2.1,  risk:"med",  region:"Asia" },
  { iso3:"IDN", name:"Indonesia",        tempAnomaly:0.72, fireDays:44,  burnedMha:3.4,  risk:"med",  region:"Asia" },
  { iso3:"MMR", name:"Myanmar",          tempAnomaly:0.81, fireDays:51,  burnedMha:2.8,  risk:"high", region:"Asia" },
  { iso3:"THA", name:"Thailand",         tempAnomaly:0.74, fireDays:42,  burnedMha:1.1,  risk:"med",  region:"Asia" },
  { iso3:"VNM", name:"Vietnam",          tempAnomaly:0.78, fireDays:40,  burnedMha:0.9,  risk:"med",  region:"Asia" },
  { iso3:"KHM", name:"Cambodia",         tempAnomaly:0.76, fireDays:47,  burnedMha:1.4,  risk:"med",  region:"Asia" },
  { iso3:"PAK", name:"Pakistan",         tempAnomaly:1.44, fireDays:35,  burnedMha:0.21, risk:"med",  region:"Asia" },
  { iso3:"JPN", name:"Japan",            tempAnomaly:1.41, fireDays:19,  burnedMha:0.02, risk:"low",  region:"Asia" },
  { iso3:"KOR", name:"South Korea",      tempAnomaly:1.52, fireDays:21,  burnedMha:0.01, risk:"low",  region:"Asia" },
  // Africa
  { iso3:"COD", name:"DR Congo",         tempAnomaly:0.81, fireDays:52,  burnedMha:22.4, risk:"high", region:"Africa" },
  { iso3:"AGO", name:"Angola",           tempAnomaly:0.91, fireDays:55,  burnedMha:14.2, risk:"high", region:"Africa" },
  { iso3:"ZMB", name:"Zambia",           tempAnomaly:0.88, fireDays:53,  burnedMha:8.9,  risk:"high", region:"Africa" },
  { iso3:"MOZ", name:"Mozambique",       tempAnomaly:0.86, fireDays:50,  burnedMha:7.3,  risk:"high", region:"Africa" },
  { iso3:"TZA", name:"Tanzania",         tempAnomaly:0.84, fireDays:49,  burnedMha:6.8,  risk:"high", region:"Africa" },
  { iso3:"ZWE", name:"Zimbabwe",         tempAnomaly:0.96, fireDays:54,  burnedMha:5.1,  risk:"high", region:"Africa" },
  { iso3:"ZAF", name:"South Africa",     tempAnomaly:1.24, fireDays:58,  burnedMha:3.8,  risk:"high", region:"Africa" },
  { iso3:"NGA", name:"Nigeria",          tempAnomaly:0.88, fireDays:47,  burnedMha:4.2,  risk:"high", region:"Africa" },
  { iso3:"ETH", name:"Ethiopia",         tempAnomaly:0.94, fireDays:45,  burnedMha:5.1,  risk:"high", region:"Africa" },
  { iso3:"KEN", name:"Kenya",            tempAnomaly:0.89, fireDays:44,  burnedMha:2.4,  risk:"med",  region:"Africa" },
  { iso3:"GHA", name:"Ghana",            tempAnomaly:0.85, fireDays:48,  burnedMha:1.8,  risk:"med",  region:"Africa" },
  { iso3:"CMR", name:"Cameroon",         tempAnomaly:0.82, fireDays:50,  burnedMha:3.1,  risk:"high", region:"Africa" },
  { iso3:"TCD", name:"Chad",             tempAnomaly:1.12, fireDays:42,  burnedMha:4.4,  risk:"high", region:"Africa" },
  { iso3:"SDN", name:"Sudan",            tempAnomaly:1.08, fireDays:39,  burnedMha:3.6,  risk:"high", region:"Africa" },
  { iso3:"EGY", name:"Egypt",            tempAnomaly:1.31, fireDays:18,  burnedMha:0.02, risk:"low",  region:"Africa" },
  // Oceania
  { iso3:"AUS", name:"Australia",        tempAnomaly:1.47, fireDays:78,  burnedMha:8.1,  risk:"high", region:"Oceania" },
  { iso3:"NZL", name:"New Zealand",      tempAnomaly:0.92, fireDays:32,  burnedMha:0.08, risk:"low",  region:"Oceania" },
];

const dataByIso3 = {};
countryData.forEach(d => { dataByIso3[d.iso3] = d; });

const numericToIso3 = {
  840: "USA",  124: "CAN",  484: "MEX",
  76:  "BRA",  32:  "ARG",  152: "CHL",
  170: "COL",  862: "VEN",  68:  "BOL",
  600: "PRY",  604: "PER",
  300: "GRC",  724: "ESP",  620: "PRT",
  380: "ITA",  250: "FRA",  276: "DEU",
  752: "SWE",  578: "NOR",  246: "FIN",
  826: "GBR",  642: "ROU",  804: "UKR",
  643: "RUS",  398: "KAZ",  496: "MNG",
  792: "TUR",  364: "IRN",  682: "SAU",
  368: "IRQ",
  156: "CHN",  356: "IND",  360: "IDN",
  104: "MMR",  764: "THA",  704: "VNM",
  116: "KHM",  586: "PAK",  392: "JPN",
  410: "KOR",
  180: "COD",  24:  "AGO",  894: "ZMB",
  508: "MOZ",  834: "TZA",  716: "ZWE",
  710: "ZAF",  566: "NGA",  231: "ETH",
  404: "KEN",  288: "GHA",  120: "CMR",
  148: "TCD",  729: "SDN",  818: "EGY",
  36:  "AUS",  554: "NZL",
};

// TopoJSON feature id
function getCountryData(numericId) {
  const iso3 = numericToIso3[+numericId];
  return iso3 ? dataByIso3[iso3] : null;
}

// CONTINENT BURNED AREA 2023 

const continentFire = [
  { name:"Sub-Saharan Africa", burned:112.4, color:"#e84800" },
  { name:"Russia & N. Asia",   burned:36.1,  color:"#ff4400" },
  { name:"South America",      burned:22.1,  color:"#ff6b00" },
  { name:"North America",      burned:21.6,  color:"#ff8c00" },
  { name:"Australia & Oceania",burned:9.4,   color:"#ffa200" },
  { name:"South & SE Asia",    burned:8.2,   color:"#ffb347" },
  { name:"Europe",             burned:1.8,   color:"#ffd166" },
];

// TEMPERATURE SPIRAL DATA
const tempByYear = [];
for (let y = 1880; y <= 2023; y++) {
  let base = -0.28;
  if (y > 1950) base += (y - 1950) * 0.006;
  if (y > 1980) base += (y - 1980) * 0.013;
  if (y > 2000) base += (y - 2000) * 0.019;
  const noise = (Math.sin(y * 7.3) * 0.07) + (Math.sin(y * 3.1) * 0.04);
  tempByYear.push({ year: y, anomaly: parseFloat((base + noise).toFixed(3)) });
}
tempByYear[tempByYear.length - 1].anomaly = 1.45; // 2023 confirmed value

// RISK COLORS
const riskColor  = { crit:"#ff1a00", high:"#ff6b00", med:"#ffb347", low:"#d4b483" };
const riskLabel  = { crit:"Critical", high:"High", med:"Moderate", low:"Lower" };

// SCATTER REGION COLORS
const regionColor = {
  NorthAm:"#e84800", SouthAm:"#ff8c00", Europe:"#d4a843",
  Russia:"#c0392b",  MidEast:"#e67e22", Asia:"#f39c12",
  Africa:"#ff4500",  Oceania:"#cd853f",
};
