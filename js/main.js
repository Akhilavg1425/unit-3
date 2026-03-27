<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Choropleth Map</title>
<script src="https://d3js.org/d3.v7.min.js"></script>
<script src="https://unpkg.com/topojson-client@3"></script>
<style>
  body { font-family: sans-serif; margin: 0; }
  svg { border: 1px solid #ccc; display: block; margin: 20px auto; }
  #tooltip {
    position: absolute;
    background: rgba(0,0,0,0.7);
    color: #fff;
    padding: 6px 10px;
    border-radius: 4px;
    pointer-events: none;
    font-size: 14px;
    display: none;
  }
</style>
</head>
<body>

<svg id="map"></svg>
<div id="tooltip"></div>

<script>
const width = 1000, height = 600;
const svg = d3.select("#map").attr("width", width).attr("height", height);
const tooltip = d3.select("#tooltip");

// ==== Your TopoJSON file content ====
const topoData = 
{};

// Automatically pick the first object in the TopoJSON
const firstKey = Object.keys(topoData.objects)[0];
const geoFeatures = topojson.feature(topoData, topoData.objects[firstKey]).features;

// Projection & path
const projection = d3.geoAlbersUsa().fitSize([width, height], { type: "FeatureCollection", features: geoFeatures });
const path = d3.geoPath(projection);

// Color scale (basic)
const fillColor = "#69b3a2";

svg.selectAll("path")
  .data(geoFeatures)
  .enter()
  .append("path")
  .attr("d", path)
  .attr("fill", fillColor)
  .attr("stroke", "#fff")
  .attr("stroke-width", 1)
  .on("mouseover", (event, d) => {
    tooltip.style("display", "block")
      .html(`<strong>${d.properties.name || "No name"}</strong>`)
      .style("left", (event.pageX + 10) + "px")
      .style("top", (event.pageY - 28) + "px");
  })
  .on("mousemove", (event) => {
    tooltip.style("left", (event.pageX + 10) + "px")
           .style("top", (event.pageY - 28) + "px");
  })
  .on("mouseout", () => tooltip.style("display", "none"));

</script>
</body>
</html>