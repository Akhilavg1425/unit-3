
//  main.js — Burning Earth: Global Wildfire Crisis

// DOM
document.addEventListener("DOMContentLoaded", () => {

  // Build legend
  buildLegend();

  // Load TopoJSON then build all charts
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
      // build the non-map charts
      buildFlameChart();
      buildSpiral();
      buildScatter();
      initScrollReveal();
    });
});

//  LEGEND — risk swatches in the hero overlay

function buildLegend() {
  const wrap = document.getElementById("legend-items");
  if (!wrap) return;
  [
    { level:"crit", label:"Critical" },
    { level:"high", label:"High" },
    { level:"med",  label:"Moderate" },
    { level:"low",  label:"Lower" },
  ].forEach(({ level, label }) => {
    const item = document.createElement("div");
    item.className = "legend-item";
    item.innerHTML = `
      <div class="legend-swatch" style="background:${riskColor[level]}"></div>
      <span class="legend-label">${label}</span>`;
    wrap.appendChild(item);
  });
}

//  MAP — Natural Earth projection, zoom+pan, FIXED hover
function buildMap(world) {
  const svg = d3.select("#map-svg");
  const W   = window.innerWidth;
  const H   = window.innerHeight;

  // Natural Earth — organic, humanized world map projection
  const projection = d3.geoNaturalEarth1()
    .fitSize([W, H], { type: "Sphere" });

  const path = d3.geoPath().projection(projection);

  svg.attr("viewBox", `0 0 ${W} ${H}`);

  // All map elements go in this group (receives zoom transform)
  const g = svg.append("g");

  // Ocean background
  g.append("path")
    .datum({ type: "Sphere" })
    .attr("class", "sphere-bg")
    .attr("d", path);

  // Graticule grid lines
  g.append("path")
    .datum(d3.geoGraticule()())
    .attr("class", "graticule")
    .attr("d", path);

  // Extract country features
  const countries = topojson.feature(world, world.objects.countries).features;

  // Draw countries
  g.selectAll(".country")
    .data(countries)
    .join("path")
      .attr("class", "country")
      .attr("d", path)
      .attr("fill", d => {
        const cd = getCountryData(d.id);
        return cd ? riskColor[cd.risk] : "#2a1200";
      })
      .attr("opacity", d => getCountryData(d.id) ? 0.88 : 0.38)

      // HOVER: show tooltip
      .on("mousemove", function(event, d) {
        const cd = getCountryData(d.id);
        if (!cd) return;

        d3.select(this).classed("active", true);
        showMapTooltip(event, cd);
      })
      .on("mouseleave", function() {
        d3.select(this).classed("active", false);
        hideMapTooltip();
      });

  // ZOOM + PAN
  // translateExtent prevents panning entirely off screen
  const zoom = d3.zoom()
    .scaleExtent([0.3, 9])
    .translateExtent([[-W * 0.5, -H * 0.5], [W * 1.5, H * 1.5]])
    .on("zoom", event => {
      g.attr("transform", event.transform);
    });

  svg.call(zoom);

  // Double-click zooms in on cursor point
  svg.on("dblclick.zoom", function(event) {
    const [mx, my] = d3.pointer(event);
    svg.transition().duration(380)
      .call(zoom.transform,
        d3.zoomIdentity.translate(W / 2 - mx * 2, H / 2 - my * 2).scale(2));
  });
}

//  TOOLTIP HELPERS — map tooltip
function showMapTooltip(event, cd) {
  // Populate content
  document.getElementById("tt-flag").textContent = getFlagEmoji(cd.iso3);
  document.getElementById("tt-name").textContent = cd.name;
  document.getElementById("tt-grid").innerHTML =
    row("Burned in 2023",       cd.burnedMha + "M ha",        "hi") +
    row("Fire-weather days/yr", cd.fireDays.toString(),        "val") +
    row("Temp anomaly",         "+" + cd.tempAnomaly + "°C",  "hi") +
    row("Risk level",           riskLabel[cd.risk],            "val");

  // Position — offset right+down from cursor, clamp to viewport
  const tip  = document.getElementById("map-tooltip");
  const tipW = 220;
  const tipH = 150;
  let x = event.clientX + 18;
  let y = event.clientY + 12;
  if (x + tipW > window.innerWidth  - 8) x = event.clientX - tipW - 18;
  if (y + tipH > window.innerHeight - 8) y = event.clientY - tipH - 12;

  tip.style.left    = x + "px";
  tip.style.top     = y + "px";
  tip.style.opacity = "1";
}

function hideMapTooltip() {
  document.getElementById("map-tooltip").style.opacity = "0";
}

// Helper: build a tooltip row HTML string
function row(label, value, style) {
  return `<div class="tt-row">
    <span>${label}</span>
    <span class="tt-${style}">${value}</span>
  </div>`;
}

// Flag emoji helper
// Converts ISO3 to regional indicator emoji pair.
// If emoji not present for a country, give a fire emoji.
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
  return iso2.split("").map(c =>
    String.fromCodePoint(c.charCodeAt(0) + 127397)
  ).join("");
}

//  FLAME BAR CHART — animated continent bars
function buildFlameChart() {
  const wrap = document.getElementById("flame-bars");
  if (!wrap) return;

  const max = d3.max(continentFire, d => d.burned);

  continentFire.forEach(cd => {
    const pct = (cd.burned / max * 100).toFixed(1);
    const row = document.createElement("div");
    row.className = "flame-row";
    row.innerHTML = `
      <div class="flame-continent">${cd.name}</div>
      <div class="flame-track">
        <div class="flame-fill"
          data-pct="${pct}"
          style="background: linear-gradient(90deg, ${cd.color}99, ${cd.color})">
        </div>
      </div>
      <div class="flame-val">${cd.burned}M ha</div>`;
    wrap.appendChild(row);
  });

  // Animate bar widths when scrolled into view
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

//  TEMPERATURE SPIRAL — radial chart 1880–2023
function buildSpiral() {
  const wrap = document.getElementById("spiral-wrap");
  if (!wrap) return;

  const size  = Math.min(wrap.clientWidth || 480, 480);
  const cx    = size / 2;
  const cy    = size / 2;
  const innerR = size * 0.07;
  const outerR = size * 0.46;

  // Scale: anomaly (-0.5 to 1.5°C) to radius
  const rScale = d3.scaleLinear()
    .domain([-0.5, 1.6])
    .range([innerR, outerR]);

  const totalYears = tempByYear.length; // 144 years

  // Each year occupies a fraction of the full rotation
  // ~4.8 full rotations over 144 years
  const angleForIndex = i => (i / totalYears) * Math.PI * 2 * 4.8 - Math.PI / 2;

  const svg = d3.select(wrap)
    .append("svg")
    .attr("width", size)
    .attr("height", size);

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
        .attr("x", cx + r + 4)
        .attr("y", cy + 3)
        .attr("font-family", "var(--font-data)")
        .attr("font-size", "9px")
        .attr("fill", v === 1.5 ? "var(--ember)" : "var(--ink-faint)")
        .text(`+${v}°C`);
    }
  });

  // Color scale: cold blue-grey to deep red
  const colorScale = d3.scaleSequential()
    .domain([-0.4, 1.5])
    .interpolator(d3.interpolate("#5a3820", "#c93a00"));

  // Spiral line segments (one per year)
  for (let i = 1; i < tempByYear.length; i++) {
    const a0 = angleForIndex(i - 1);
    const a1 = angleForIndex(i);
    const r0 = rScale(tempByYear[i - 1].anomaly);
    const r1 = rScale(tempByYear[i].anomaly);

    svg.append("line")
      .attr("x1", cx + r0 * Math.cos(a0))
      .attr("y1", cy + r0 * Math.sin(a0))
      .attr("x2", cx + r1 * Math.cos(a1))
      .attr("y2", cy + r1 * Math.sin(a1))
      .attr("stroke", colorScale(tempByYear[i].anomaly))
      .attr("stroke-width", 1.6)
      .attr("opacity", 0.88);
  }

  // Pulsing dot at 2023
  const lastIdx = tempByYear.length - 1;
  const lastAngle = angleForIndex(lastIdx);
  const lastR     = rScale(tempByYear[lastIdx].anomaly);
  const px = cx + lastR * Math.cos(lastAngle);
  const py = cy + lastR * Math.sin(lastAngle);

  // Pulsing ring (CSS-like animation via D3 transition)
  const pulseRing = svg.append("circle")
    .attr("cx", px).attr("cy", py)
    .attr("r", 6)
    .attr("fill", "none")
    .attr("stroke", "var(--ember)")
    .attr("stroke-width", 1.5)
    .attr("opacity", 0.8);

  (function animatePulse() {
    pulseRing
      .attr("r", 6).attr("opacity", 0.8)
      .transition().duration(1800).ease(d3.easeLinear)
      .attr("r", 26).attr("opacity", 0)
      .on("end", animatePulse);
  })();

  // Solid center dot
  svg.append("circle")
    .attr("cx", px).attr("cy", py)
    .attr("r", 5)
    .attr("fill", "var(--ember)")
    .attr("stroke", "var(--paper)")
    .attr("stroke-width", 1.5);

  // Label for 2023
  svg.append("text")
    .attr("x", px + 10)
    .attr("y", py - 6)
    .attr("font-family", "var(--font-body)")
    .attr("font-style", "italic")
    .attr("font-size", "11px")
    .attr("fill", "var(--ember)")
    .text("2023 · +1.45°C");

  // Year markers at decade starts
  [1880, 1920, 1960, 2000, 2020].forEach(yr => {
    const idx = yr - 1880;
    if (idx >= tempByYear.length) return;
    const ang = angleForIndex(idx);
    const r   = rScale(tempByYear[idx].anomaly);
    svg.append("text")
      .attr("x", cx + (r + 10) * Math.cos(ang))
      .attr("y", cy + (r + 10) * Math.sin(ang))
      .attr("text-anchor", "middle")
      .attr("font-family", "var(--font-data)")
      .attr("font-size", "8px")
      .attr("fill", "var(--ink-faint)")
      .text(yr);
  });

  // Center label
  svg.append("text")
    .attr("x", cx).attr("y", cy - 6)
    .attr("text-anchor", "middle")
    .attr("font-family", "var(--font-display)")
    .attr("font-size", "11px")
    .attr("fill", "var(--ink-faint)")
    .text("1880");
  svg.append("text")
    .attr("x", cx).attr("y", cy + 9)
    .attr("text-anchor", "middle")
    .attr("font-family", "var(--font-display)")
    .attr("font-size", "11px")
    .attr("fill", "var(--ink-faint)")
    .text("to 2023");
}

//  SCATTER PLOT — temp anomaly (X) vs fire-weather days (Y)
function buildScatter() {
  const wrap = document.getElementById("scatter-wrap");
  if (!wrap) return;

  const W  = Math.max(wrap.clientWidth || 860, 600);
  const H  = Math.min(Math.round(W * 0.42), 380);
  const mg = { top: 14, right: 90, bottom: 46, left: 56 };
  const iw = W - mg.left - mg.right;
  const ih = H - mg.top  - mg.bottom;

  const svg = d3.select(wrap)
    .append("svg")
    .attr("width", W)
    .attr("height", H);

  const g = svg.append("g")
    .attr("transform", `translate(${mg.left},${mg.top})`);

  // Scales
  const xS = d3.scaleLinear().domain([0.6, 2.6]).range([0, iw]);
  const yS = d3.scaleLinear().domain([10, 100]).range([ih, 0]);
  const rS = d3.scaleSqrt()
    .domain([0, d3.max(countryData, d => d.burnedMha)])
    .range([4, 30]);

  // Color by temperature (cool brown to deep red)
  const cS = d3.scaleSequential()
    .domain([0.6, 2.5])
    .interpolator(d3.interpolate("#c8941a", "#c93a00"));

  // Background grid
  g.selectAll(".sc-grid-line-x")
    .data(xS.ticks(6)).join("line")
    .attr("class", "sc-grid-line")
    .attr("x1", d => xS(d)).attr("x2", d => xS(d))
    .attr("y1", 0).attr("y2", ih);

  g.selectAll(".sc-grid-line-y")
    .data(yS.ticks(5)).join("line")
    .attr("class", "sc-grid-line")
    .attr("x1", 0).attr("x2", iw)
    .attr("y1", d => yS(d)).attr("y2", d => yS(d));

  // Trend line (ordinary least squares)
  const xs  = countryData.map(d => d.tempAnomaly);
  const ys  = countryData.map(d => d.fireDays);
  const n   = xs.length;
  const mx  = d3.mean(xs);
  const my  = d3.mean(ys);
  const m   = d3.sum(xs.map((x, i) => (x - mx) * (ys[i] - my))) /
              d3.sum(xs.map(x => (x - mx) ** 2));
  const b   = my - m * mx;

  g.append("line")
    .attr("x1", xS(0.6)).attr("y1", yS(m * 0.6 + b))
    .attr("x2", xS(2.6)).attr("y2", yS(m * 2.6 + b))
    .attr("stroke", "var(--ember)")
    .attr("stroke-width", 1.3)
    .attr("stroke-dasharray", "6,4")
    .attr("opacity", 0.55);

  // 1.5°C threshold line
  g.append("line")
    .attr("x1", xS(1.5)).attr("x2", xS(1.5))
    .attr("y1", 0).attr("y2", ih)
    .attr("stroke", "var(--ember)")
    .attr("stroke-width", 0.9)
    .attr("stroke-dasharray", "3,3")
    .attr("opacity", 0.45);

  g.append("text")
    .attr("x", xS(1.5) + 4)
    .attr("y", 12)
    .attr("class", "sc-annotation")
    .text("1.5°C threshold");

  // Axes
  g.append("g").attr("class", "sc-axis")
    .attr("transform", `translate(0,${ih})`)
    .call(d3.axisBottom(xS).ticks(6).tickFormat(d => `+${d}°C`));

  g.append("g").attr("class", "sc-axis")
    .call(d3.axisLeft(yS).ticks(5));

  // Axis labels
  g.append("text")
    .attr("x", iw / 2).attr("y", ih + 38)
    .attr("text-anchor", "middle")
    .attr("font-family", "var(--font-data)")
    .attr("font-size", "10px")
    .attr("fill", "var(--ink-faint)")
    .text("Temperature Anomaly (°C above pre-industrial baseline)");

  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -ih / 2).attr("y", -42)
    .attr("text-anchor", "middle")
    .attr("font-family", "var(--font-data)")
    .attr("font-size", "10px")
    .attr("fill", "var(--ink-faint)")
    .text("Annual Fire-Weather Days");

  // Dots
  const dots = g.selectAll(".sc-dot")
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
      .on("mousemove", function(event, d) {
        d3.select(this)
          .attr("opacity", 1)
          .attr("stroke", "var(--ink)")
          .attr("stroke-width", 1.8);

        document.getElementById("sc-tt-name").textContent = d.name;
        document.getElementById("sc-tt-grid").innerHTML =
          row("Temp anomaly",         "+" + d.tempAnomaly + "°C", "hi") +
          row("Fire-weather days/yr", d.fireDays + " days",        "hi") +
          row("Burned in 2023",       d.burnedMha + "M ha",        "val") +
          row("Risk level",           riskLabel[d.risk],            "val");

        const tip = document.getElementById("sc-tooltip");
        const tipW = 220, tipH = 140;
        let x = event.clientX + 18;
        let y = event.clientY + 12;
        if (x + tipW > window.innerWidth  - 8) x = event.clientX - tipW - 18;
        if (y + tipH > window.innerHeight - 8) y = event.clientY - tipH - 12;
        tip.style.left    = x + "px";
        tip.style.top     = y + "px";
        tip.style.opacity = "1";
      })
      .on("mouseleave", function() {
        d3.select(this)
          .attr("opacity", 0.75)
          .attr("stroke", "rgba(80,30,10,0.4)")
          .attr("stroke-width", 0.8);
        document.getElementById("sc-tooltip").style.opacity = "0";
      });

  // Animate dots in when section scrolls into view
  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      dots.transition()
        .duration(700)
        .delay((d, i) => i * 14)
        .ease(d3.easeBounceOut)
        .attr("r", d => rS(d.burnedMha));
      obs.disconnect();
    }
  }, { threshold: 0.2 });
  obs.observe(document.getElementById("scatter-section"));

  // Country name labels for notable countries
  const labelCountries = [
    "Canada","Russia","DR Congo","Australia","Brazil",
    "United States","Greece","Mongolia","Angola"
  ];
  g.selectAll(".sc-dot-label")
    .data(countryData.filter(d => labelCountries.includes(d.name)), d => d.iso3)
    .join("text")
      .attr("class", "sc-dot-label")
      .attr("x", d => xS(d.tempAnomaly) + rS(d.burnedMha) + 4)
      .attr("y", d => yS(d.fireDays) + 3)
      .text(d => d.name);
}

//  SCROLL REVEAL — fade sections up as they enter viewport
function initScrollReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll(".reveal").forEach(el => observer.observe(el));
}
