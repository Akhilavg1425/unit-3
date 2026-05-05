
// main.js — Burning Earth: Global Wildfire Crisis
// Improvements: coordinated reexpress (attribute switcher), coordinated retrieve
// (cross-highlighting between map, bars, scatter), scroll-down button

// SHARED STATE 
let currentAttr     = "risk";          // active map attribute
let activeRegion    = null;            // currently selected continent region
let activeCountry   = null;            // currently highlighted country ISO3
let mapCountryPaths = null;            // D3 selection of all country paths
let scatterDots     = null;            // D3 selection of scatter dots
let flameRows       = null;            // NodeList of flame bar rows

// Color scales for each attribute
const attrScales = {
  risk: d => riskColor[d.risk] || "#2a1200",

  tempAnomaly: (() => {
    const s = d3.scaleSequential()
      .domain([0.6, 2.5])
      .interpolator(d3.interpolate("#c8a060", "#c93a00"));
    return d => s(d.tempAnomaly);
  })(),

  burnedMha: (() => {
    const s = d3.scaleSequential()
      .domain([0, 30])
      .interpolator(d3.interpolate("#3a1800", "#e86000"));
    return d => s(d.burnedMha);
  })(),
};

const attrLegend = {
  risk: {
    title: "Wildfire Risk Level",
    type: "categorical",
    items: [
      { color: riskColor.crit, label: "Critical" },
      { color: riskColor.high, label: "High" },
      { color: riskColor.med,  label: "Moderate" },
      { color: riskColor.low,  label: "Lower" },
    ],
  },
  tempAnomaly: {
    title: "Temp Anomaly (°C)",
    type: "gradient",
    from: "#c8a060", to: "#c93a00",
    labelLow: "+0.6°C", labelHigh: "+2.5°C",
  },
  burnedMha: {
    title: "Burned Area 2023",
    type: "gradient",
    from: "#3a1800", to: "#e86000",
    labelLow: "0 M ha", labelHigh: "30 M ha",
  },
};

// BOOT 
document.addEventListener("DOMContentLoaded", () => {
  buildLegend(currentAttr);
  initScrollButton();
  initAttrSwitcher();

  d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
    .then(world => {
      buildMap(world);
      buildFlameChart();
      buildSpiral();
      buildScatter();
      initScrollReveal();
    })
    .catch(err => {
      console.error("TopoJSON load failed:", err);
      buildFlameChart();
      buildSpiral();
      buildScatter();
      initScrollReveal();
    });
});

//SCROLL DOWN BUTTON 
function initScrollButton() {
  const btn = document.getElementById("scroll-down-btn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    document.getElementById("story").scrollIntoView({ behavior: "smooth" });
  });
}

//  ATTRIBUTE SWITCHER 
function initAttrSwitcher() {
  document.querySelectorAll(".attr-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const attr = btn.dataset.attr;
      if (attr === currentAttr) return;

      // Update active button
      document.querySelectorAll(".attr-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      currentAttr = attr;
      updateMapColors();
      buildLegend(attr);
    });
  });
}

// LEGEND 
function buildLegend(attr) {
  const wrap  = document.getElementById("legend-items");
  const title = document.getElementById("legend-title");
  if (!wrap || !title) return;

  const cfg = attrLegend[attr];
  title.textContent = cfg.title;
  wrap.innerHTML = "";

  if (cfg.type === "categorical") {
    cfg.items.forEach(({ color, label }) => {
      const item = document.createElement("div");
      item.className = "legend-item";
      item.innerHTML = `<div class="legend-swatch" style="background:${color}"></div>
                        <span class="legend-label">${label}</span>`;
      wrap.appendChild(item);
    });
  } else {
    // Gradient bar
    const bar = document.createElement("div");
    bar.className = "legend-gradient-bar";
    bar.style.background = `linear-gradient(90deg, ${cfg.from}, ${cfg.to})`;
    wrap.appendChild(bar);

    const labels = document.createElement("div");
    labels.className = "legend-gradient-labels";
    labels.innerHTML = `<span>${cfg.labelLow}</span><span>${cfg.labelHigh}</span>`;
    wrap.appendChild(labels);
  }
}

//  MAP 
function buildMap(world) {
  const svg = d3.select("#map-svg");
  const W   = window.innerWidth;
  const H   = window.innerHeight;

  const projection = d3.geoNaturalEarth1().fitSize([W, H], { type: "Sphere" });
  const path       = d3.geoPath().projection(projection);

  svg.attr("viewBox", `0 0 ${W} ${H}`);
  const g = svg.append("g");

  g.append("path").datum({ type: "Sphere" }).attr("class", "sphere-bg").attr("d", path);
  g.append("path").datum(d3.geoGraticule()()).attr("class", "graticule").attr("d", path);

  const countries = topojson.feature(world, world.objects.countries).features;

  mapCountryPaths = g.selectAll(".country")
    .data(countries)
    .join("path")
      .attr("class", "country")
      .attr("d", path)
      .attr("fill",    d => colorForCountry(d))
      .attr("opacity", d => getCountryData(d.id) ? 0.88 : 0.38)

      .on("mousemove", function(event, d) {
        const cd = getCountryData(d.id);
        if (!cd) return;
        d3.select(this).classed("active", true);
        showMapTooltip(event, cd);
        // Coordinate: highlight this country's dot in scatter
        highlightCountry(cd.iso3, "map");
      })
      .on("mouseleave", function() {
        d3.select(this).classed("active", false);
        hideMapTooltip();
        clearCountryHighlight("map");
      });

  // Map is intentionally static — no zoom or pan so page scroll works normally
}

// Recolor map when attribute changes
function updateMapColors() {
  if (!mapCountryPaths) return;
  mapCountryPaths
    .transition().duration(500)
    .attr("fill",    d => colorForCountry(d))
    .attr("opacity", d => getCountryData(d.id) ? 0.88 : 0.38);
}

function colorForCountry(d) {
  const cd = getCountryData(d.id);
  if (!cd) return "#2a1200";
  return attrScales[currentAttr](cd);
}

// COORDINATED HIGHLIGHT — by country 
function highlightCountry(iso3, source) {
  if (activeCountry === iso3) return;
  activeCountry = iso3;

  // Highlight on scatter dots
  if (scatterDots) {
    scatterDots
      .classed("coordinated-highlight", d => d.iso3 === iso3)
      .classed("dimmed", d => d.iso3 !== iso3);
  }

  // Highlight on map (only if source is not map itself)
  if (source !== "map" && mapCountryPaths) {
    mapCountryPaths
      .classed("coordinated-highlight", d => {
        const cd = getCountryData(d.id);
        return cd && cd.iso3 === iso3;
      })
      .classed("dimmed", d => {
        const cd = getCountryData(d.id);
        return cd && cd.iso3 !== iso3;
      });
  }
}

function clearCountryHighlight(source) {
  activeCountry = null;

  if (scatterDots) {
    scatterDots.classed("coordinated-highlight", false);
    // Restore region dimming if a region is active
    if (activeRegion) {
      applyRegionFilter(activeRegion);
    } else {
      scatterDots.classed("dimmed", false);
    }
  }

  if (source !== "map" && mapCountryPaths) {
    mapCountryPaths.classed("coordinated-highlight", false);
    if (activeRegion) {
      applyRegionFilterMap(activeRegion);
    } else {
      mapCountryPaths.classed("dimmed", false);
    }
  }
}

// COORDINATED HIGHLIGHT — by continent region 
// Maps continent bar names to country region codes in data.js
const continentToRegion = {
  "Sub-Saharan Africa": "Africa",
  "Russia & N. Asia":   "Russia",
  "South America":      "SouthAm",
  "North America":      "NorthAm",
  "Australia & Oceania":"Oceania",
  "South & SE Asia":    "Asia",
  "Europe":             "Europe",
};

function applyRegionFilter(continentName) {
  const region = continentToRegion[continentName];

  // Filter scatter dots
  if (scatterDots) {
    scatterDots
      .classed("dimmed", d => d.region !== region)
      .classed("coordinated-highlight", false);
  }

  // Filter map countries
  if (mapCountryPaths) {
    mapCountryPaths
      .classed("dimmed", d => {
        const cd = getCountryData(d.id);
        return cd && cd.region !== region;
      })
      .classed("coordinated-highlight", false);
  }
}

function applyRegionFilterMap(continentName) {
  const region = continentToRegion[continentName];
  if (mapCountryPaths) {
    mapCountryPaths
      .classed("dimmed", d => {
        const cd = getCountryData(d.id);
        return cd && cd.region !== region;
      })
      .classed("coordinated-highlight", false);
  }
}

function clearRegionFilter() {
  activeRegion = null;
  if (scatterDots)     scatterDots.classed("dimmed", false).classed("coordinated-highlight", false);
  if (mapCountryPaths) mapCountryPaths.classed("dimmed", false).classed("coordinated-highlight", false);

  // Reset bar rows
  if (flameRows) {
    flameRows.forEach(r => { r.classList.remove("bar-active", "bar-dimmed"); });
  }
}

// TOOLTIP HELPERS 
function showMapTooltip(event, cd) {
  document.getElementById("tt-flag").textContent = getFlagEmoji(cd.iso3);
  document.getElementById("tt-name").textContent = cd.name;
  document.getElementById("tt-grid").innerHTML =
    row("Burned in 2023",       cd.burnedMha + "M ha",       "hi") +
    row("Fire-weather days/yr", cd.fireDays.toString(),       "val") +
    row("Temp anomaly",         "+" + cd.tempAnomaly + "°C", "hi") +
    row("Risk level",           riskLabel[cd.risk],           "val");

  positionTooltip("map-tooltip", event, 220, 150);
}
function hideMapTooltip() {
  document.getElementById("map-tooltip").style.opacity = "0";
}

function positionTooltip(id, event, tipW, tipH) {
  const tip = document.getElementById(id);
  let x = event.clientX + 18;
  let y = event.clientY + 12;
  if (x + tipW > window.innerWidth  - 8) x = event.clientX - tipW - 18;
  if (y + tipH > window.innerHeight - 8) y = event.clientY - tipH - 12;
  tip.style.left    = x + "px";
  tip.style.top     = y + "px";
  tip.style.opacity = "1";
}

function row(label, value, style) {
  return `<div class="tt-row"><span>${label}</span><span class="tt-${style}">${value}</span></div>`;
}

const iso3toIso2 = {
  USA:"US",CAN:"CA",MEX:"MX",BRA:"BR",ARG:"AR",CHL:"CL",COL:"CO",
  VEN:"VE",BOL:"BO",PRY:"PY",PER:"PE",GRC:"GR",ESP:"ES",PRT:"PT",
  ITA:"IT",FRA:"FR",DEU:"DE",SWE:"SE",NOR:"NO",FIN:"FI",GBR:"GB",
  ROU:"RO",UKR:"UA",RUS:"RU",KAZ:"KZ",MNG:"MN",TUR:"TR",IRN:"IR",
  SAU:"SA",IRQ:"IQ",CHN:"CN",IND:"IN",IDN:"ID",MMR:"MM",THA:"TH",
  VNM:"VN",KHM:"KH",PAK:"PK",JPN:"JP",KOR:"KR",COD:"CD",AGO:"AO",
  ZMB:"ZM",MOZ:"MZ",TZA:"TZ",ZWE:"ZW",ZAF:"ZA",NGA:"NG",ETH:"ET",
  KEN:"KE",GHA:"GH",CMR:"CM",TCD:"TD",SDN:"SD",EGY:"EG",AUS:"AU",
  NZL:"NZ",
};
function getFlagEmoji(iso3) {
  const iso2 = iso3toIso2[iso3];
  if (!iso2) return "🔥";
  return iso2.split("").map(c => String.fromCodePoint(c.charCodeAt(0) + 127397)).join("");
}

// FLAME BAR CHART 
function buildFlameChart() {
  const wrap = document.getElementById("flame-bars");
  if (!wrap) return;

  const max = d3.max(continentFire, d => d.burned);

  continentFire.forEach(cd => {
    const pct = (cd.burned / max * 100).toFixed(1);
    const rowEl = document.createElement("div");
    rowEl.className = "flame-row";
    rowEl.dataset.continent = cd.name;
    rowEl.innerHTML = `
      <div class="flame-continent">${cd.name}</div>
      <div class="flame-track">
        <div class="flame-fill" data-pct="${pct}"
          style="background:linear-gradient(90deg,${cd.color}99,${cd.color})"></div>
      </div>
      <div class="flame-val">${cd.burned}M ha</div>`;
    wrap.appendChild(rowEl);

    // Click: coordinate with map and scatter
    rowEl.addEventListener("click", () => {
      const name = cd.name;
      if (activeRegion === name) {
        clearRegionFilter();
      } else {
        activeRegion = name;
        applyRegionFilter(name);

        // Update bar states
        document.querySelectorAll(".flame-row").forEach(r => {
          const isActive = r.dataset.continent === name;
          r.classList.toggle("bar-active", isActive);
          r.classList.toggle("bar-dimmed", !isActive);
        });
      }
    });
  });

  flameRows = document.querySelectorAll(".flame-row");

  // Animate bars on scroll
  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      wrap.querySelectorAll(".flame-fill").forEach(el => {
        el.style.width = el.dataset.pct + "%";
      });
      obs.disconnect();
    }
  }, { threshold: 0.25 });
  obs.observe(wrap);
}

// TEMPERATURE SPIRAL 
function buildSpiral() {
  const wrap = document.getElementById("spiral-wrap");
  if (!wrap) return;

  const size   = Math.min(wrap.clientWidth || 480, 480);
  const cx     = size / 2;
  const cy     = size / 2;
  const innerR = size * 0.07;
  const outerR = size * 0.46;

  const rScale = d3.scaleLinear().domain([-0.5, 1.6]).range([innerR, outerR]);

  const totalYears  = tempByYear.length;
  const angleForIndex = i => (i / totalYears) * Math.PI * 2 * 4.8 - Math.PI / 2;

  const svg = d3.select(wrap).append("svg").attr("width", size).attr("height", size);

  // Reference rings
  [-0.3, 0, 0.5, 1.0, 1.5].forEach(v => {
    const r = rScale(v);
    svg.append("circle")
      .attr("cx", cx).attr("cy", cy).attr("r", r)
      .attr("fill", "none")
      .attr("stroke", v === 1.5 ? "rgba(200,58,0,0.5)" : "rgba(100,60,20,0.18)")
      .attr("stroke-width", v === 1.5 ? 1.4 : 0.6)
      .attr("stroke-dasharray", v === 1.5 ? "4,3" : "none");

    if (v >= 0) {
      svg.append("text")
        .attr("x", cx + r + 4).attr("y", cy + 3)
        .attr("font-family", "var(--font-data)").attr("font-size", "9px")
        .attr("fill", v === 1.5 ? "var(--ember)" : "var(--ink-faint)")
        .text(`+${v}°C`);
    }
  });

  const colorScale = d3.scaleSequential()
    .domain([-0.4, 1.5])
    .interpolator(d3.interpolate("#5a3820", "#c93a00"));

  for (let i = 1; i < tempByYear.length; i++) {
    const a0 = angleForIndex(i - 1), a1 = angleForIndex(i);
    const r0 = rScale(tempByYear[i - 1].anomaly);
    const r1 = rScale(tempByYear[i].anomaly);
    svg.append("line")
      .attr("x1", cx + r0 * Math.cos(a0)).attr("y1", cy + r0 * Math.sin(a0))
      .attr("x2", cx + r1 * Math.cos(a1)).attr("y2", cy + r1 * Math.sin(a1))
      .attr("stroke", colorScale(tempByYear[i].anomaly))
      .attr("stroke-width", 1.6).attr("opacity", 0.88);
  }

  const lastIdx   = tempByYear.length - 1;
  const lastAngle = angleForIndex(lastIdx);
  const lastR     = rScale(tempByYear[lastIdx].anomaly);
  const px = cx + lastR * Math.cos(lastAngle);
  const py = cy + lastR * Math.sin(lastAngle);

  const pulseRing = svg.append("circle")
    .attr("cx", px).attr("cy", py).attr("r", 6)
    .attr("fill", "none").attr("stroke", "var(--ember)")
    .attr("stroke-width", 1.5).attr("opacity", 0.8);

  (function animatePulse() {
    pulseRing.attr("r", 6).attr("opacity", 0.8)
      .transition().duration(1800).ease(d3.easeLinear)
      .attr("r", 26).attr("opacity", 0)
      .on("end", animatePulse);
  })();

  svg.append("circle").attr("cx", px).attr("cy", py).attr("r", 5)
    .attr("fill", "var(--ember)").attr("stroke", "var(--paper)").attr("stroke-width", 1.5);

  svg.append("text").attr("x", px + 10).attr("y", py - 6)
    .attr("font-family", "var(--font-body)").attr("font-style", "italic")
    .attr("font-size", "11px").attr("fill", "var(--ember)")
    .text("2023 · +1.45°C");

  [1880, 1920, 1960, 2000, 2020].forEach(yr => {
    const idx = yr - 1880;
    if (idx >= tempByYear.length) return;
    const ang = angleForIndex(idx);
    const r   = rScale(tempByYear[idx].anomaly);
    svg.append("text")
      .attr("x", cx + (r + 10) * Math.cos(ang)).attr("y", cy + (r + 10) * Math.sin(ang))
      .attr("text-anchor", "middle").attr("font-family", "var(--font-data)")
      .attr("font-size", "8px").attr("fill", "var(--ink-faint)").text(yr);
  });

  svg.append("text").attr("x", cx).attr("y", cy - 6)
    .attr("text-anchor", "middle").attr("font-family", "var(--font-display)")
    .attr("font-size", "11px").attr("fill", "var(--ink-faint)").text("1880");
  svg.append("text").attr("x", cx).attr("y", cy + 9)
    .attr("text-anchor", "middle").attr("font-family", "var(--font-display)")
    .attr("font-size", "11px").attr("fill", "var(--ink-faint)").text("to 2023");
}

// SCATTER PLOT 
function buildScatter() {
  const wrap = document.getElementById("scatter-wrap");
  if (!wrap) return;

  const W  = Math.max(wrap.clientWidth || 860, 600);
  const H  = Math.min(Math.round(W * 0.42), 380);
  const mg = { top: 14, right: 90, bottom: 46, left: 56 };
  const iw = W - mg.left - mg.right;
  const ih = H - mg.top  - mg.bottom;

  const svg = d3.select(wrap).append("svg").attr("width", W).attr("height", H);
  const g   = svg.append("g").attr("transform", `translate(${mg.left},${mg.top})`);

  const xS = d3.scaleLinear().domain([0.6, 2.6]).range([0, iw]);
  const yS = d3.scaleLinear().domain([10, 100]).range([ih, 0]);
  const rS = d3.scaleSqrt()
    .domain([0, d3.max(countryData, d => d.burnedMha)])
    .range([4, 30]);
  const cS = d3.scaleSequential()
    .domain([0.6, 2.5])
    .interpolator(d3.interpolate("#c8941a", "#c93a00"));

  // Grid
  g.selectAll(".sc-grid-line-x")
    .data(xS.ticks(6)).join("line").attr("class", "sc-grid-line")
    .attr("x1", d => xS(d)).attr("x2", d => xS(d)).attr("y1", 0).attr("y2", ih);
  g.selectAll(".sc-grid-line-y")
    .data(yS.ticks(5)).join("line").attr("class", "sc-grid-line")
    .attr("x1", 0).attr("x2", iw).attr("y1", d => yS(d)).attr("y2", d => yS(d));

  // Trend line
  const xs = countryData.map(d => d.tempAnomaly);
  const ys = countryData.map(d => d.fireDays);
  const mx = d3.mean(xs), my = d3.mean(ys);
  const m  = d3.sum(xs.map((x,i) => (x-mx)*(ys[i]-my))) / d3.sum(xs.map(x => (x-mx)**2));
  const b  = my - m * mx;

  g.append("line")
    .attr("x1", xS(0.6)).attr("y1", yS(m*0.6+b))
    .attr("x2", xS(2.6)).attr("y2", yS(m*2.6+b))
    .attr("stroke", "var(--ember)").attr("stroke-width", 1.3)
    .attr("stroke-dasharray", "6,4").attr("opacity", 0.55);

  // 1.5°C threshold
  g.append("line")
    .attr("x1", xS(1.5)).attr("x2", xS(1.5)).attr("y1", 0).attr("y2", ih)
    .attr("stroke", "var(--ember)").attr("stroke-width", 0.9)
    .attr("stroke-dasharray", "3,3").attr("opacity", 0.45);
  g.append("text").attr("x", xS(1.5)+4).attr("y", 12)
    .attr("class", "sc-annotation").text("1.5°C threshold");

  // Axes
  g.append("g").attr("class", "sc-axis").attr("transform", `translate(0,${ih})`)
    .call(d3.axisBottom(xS).ticks(6).tickFormat(d => `+${d}°C`));
  g.append("g").attr("class", "sc-axis").call(d3.axisLeft(yS).ticks(5));

  g.append("text").attr("x", iw/2).attr("y", ih+38).attr("text-anchor","middle")
    .attr("font-family","var(--font-data)").attr("font-size","10px")
    .attr("fill","var(--ink-faint)")
    .text("Temperature Anomaly (°C above pre-industrial baseline)");
  g.append("text").attr("transform","rotate(-90)").attr("x",-ih/2).attr("y",-42)
    .attr("text-anchor","middle").attr("font-family","var(--font-data)")
    .attr("font-size","10px").attr("fill","var(--ink-faint)")
    .text("Annual Fire-Weather Days");

  // Dots — stored in module-level variable for coordination
  scatterDots = g.selectAll(".sc-dot")
    .data(countryData, d => d.iso3)
    .join("circle")
      .attr("class", "sc-dot")
      .attr("cx", d => xS(d.tempAnomaly))
      .attr("cy", d => yS(d.fireDays))
      .attr("r",  0)
      .attr("fill",   d => cS(d.tempAnomaly))
      .attr("opacity", 0.75)
      .attr("stroke", "rgba(80,30,10,0.4)")
      .attr("stroke-width", 0.8)

      // HOVER: show tooltip AND highlight country on map
      .on("mousemove", function(event, d) {
        d3.select(this)
          .attr("opacity", 1)
          .attr("stroke", "var(--ink)").attr("stroke-width", 1.8);

        document.getElementById("sc-tt-name").textContent = d.name;
        document.getElementById("sc-tt-grid").innerHTML =
          row("Temp anomaly",         "+" + d.tempAnomaly + "°C", "hi") +
          row("Fire-weather days/yr", d.fireDays + " days",        "hi") +
          row("Burned in 2023",       d.burnedMha + "M ha",        "val") +
          row("Risk level",           riskLabel[d.risk],            "val");

        positionTooltip("sc-tooltip", event, 220, 140);

        // COORDINATED RETRIEVE: highlight this country on the map
        highlightCountry(d.iso3, "scatter");
      })
      .on("mouseleave", function(event, d) {
        d3.select(this)
          .attr("opacity", 0.75)
          .attr("stroke", "rgba(80,30,10,0.4)").attr("stroke-width", 0.8);
        document.getElementById("sc-tooltip").style.opacity = "0";

        clearCountryHighlight("scatter");
      });

  // Animate dots in
  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      scatterDots.transition().duration(700).delay((d,i) => i*14)
        .ease(d3.easeBounceOut).attr("r", d => rS(d.burnedMha));
      obs.disconnect();
    }
  }, { threshold: 0.2 });
  obs.observe(document.getElementById("scatter-section"));

  // Labels for notable countries
  const labelCountries = ["Canada","Russia","DR Congo","Australia","Brazil","United States","Greece","Mongolia","Angola"];
  g.selectAll(".sc-dot-label")
    .data(countryData.filter(d => labelCountries.includes(d.name)), d => d.iso3)
    .join("text")
      .attr("class", "sc-dot-label")
      .attr("x", d => xS(d.tempAnomaly) + rS(d.burnedMha) + 4)
      .attr("y", d => yS(d.fireDays) + 3)
      .text(d => d.name);
}

// SCROLL REVEAL 
function initScrollReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add("visible");
    });
  }, { threshold: 0.1 });
  document.querySelectorAll(".reveal").forEach(el => observer.observe(el));
}
