// SVG size
const width = 900;
const height = 500;

// create SVG
const svg = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// load data
d3.csv("data/cities.csv").then(function(data){

    // convert to number
    data.forEach(d => {
        d.population = +d.population;
    });

    // X positioning
    const x = d3.scaleLinear()
        .domain([0, data.length - 1])
        .range([100, 800]);

    // Y positioning
    const y = d3.scaleLinear()
        .domain([0, 700000])
        .range([450, 50]);

    // Radius scale
    const r = d3.scaleSqrt()
        .domain([0, 700000])
        .range([10, 60]);

    // Draw circles
    svg.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", (d,i) => x(i))
        .attr("cy", d => y(d.population))
        .attr("r", d => r(d.population))
        .attr("fill", "orange")
        .attr("stroke", "black");

    // Labels
    svg.selectAll("text")
        .data(data)
        .enter()
        .append("text")
        .attr("x", (d,i) => x(i) + 10)
        .attr("y", d => y(d.population))
        .text(d => d.city + " Pop. " + d.population)
        .style("font-size", "12px");

    // Y Axis
    const yAxis = d3.axisLeft(y);

    svg.append("g")
        .attr("transform", "translate(80,0)")
        .call(yAxis);

});