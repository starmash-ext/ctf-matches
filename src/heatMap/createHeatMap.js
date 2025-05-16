import * as d3 from "d3";
import {hourToAMPM} from "../utils.jsx";
import _ from "lodash/fp.js";

export const createHeatMap = (svg,{rows,rowNames,columns,data,currentUser}) => {
  // set the dimensions and margins of the graph
  const margin = {top: 0, right: 25, bottom: 20, left: 40},
    width = 650 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

  svg.append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);



  // Build X scales and axis:
  const x = d3.scaleBand()
    .range([ 0, width ])
    .domain(columns)
    .padding(0.05);
  svg.append("g")
    .style("font-size", 15)
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x).tickSize(3).tickValues(columns.filter((_,i) => i % 3 === 0)))
    .select(".domain").remove()

  // Build Y scales and axis:
  const y = d3.scaleBand()
    .range([ height, 0 ])
    .domain(rows)
    .padding(0.05);
  svg.append("g")
    .style("font-size", 15)
    .call(d3.axisLeft(y).tickSize(0).tickFormat(i => rowNames[i]))
    .select(".domain").remove()

  // Build color scale
  const pastColor = d3.scaleSequential()
    .interpolator((t) => {
      if (t < 0.1) {
        return "white"; // Return white at the start of the domain (t=0)
      } else {
        return d3.interpolateBlues(t); // Or any other interpolator
      }
    })
    .domain([0,20])
  // Build color scale
  const futureColor = d3.scaleSequential()
    .interpolator((t) => {
      if (t === 0) {
        return "white"; // Return white at the start of the domain (t=0)
      } else {
        return d3.interpolateGreens(t); // Or any other interpolator
      }
    })
    .domain([0,20])

  // add the squares

  const items = svg.selectAll()
    .data(data, function(d) {return d.hour+':'+d.row})
    .join("rect")
    .attr("x", function(d) { return x(d.hour) })
    .attr("y", function(d) { return y(d.row) })
    .attr("rx", 4)
    .attr("ry", 4)
    .attr("width", x.bandwidth() )
    .attr("height", y.bandwidth() )
    .style("fill", function(d) { return d.date > Date.now() ? futureColor(d.value) : pastColor(d.value) } )
    .style("stroke-width", 4)
    .style("stroke","none")
    .style("opacity", 1)

  svg.selectAll()
    .data([{row:7,hour:0}], function(d) {return d.hour+':'+d.row})
    .join("rect")
    .attr("x", function(d) { return x(d.hour) })
    .attr("y", function(d) { return y(d.row) })
    .attr("rx", 4)
    .attr("ry", 4)
    .attr("width", x.step()*24 )
    .attr("height", y.bandwidth() )
    .style("fill", "gray" )
    .style("stroke-width", 1)
    .style("pointer-events","none")
    .style("stroke","none")
    .style("opacity", 0.08)

  svg.selectAll()
    .data([{row:14,hour:hourToAMPM(new Date().getHours())}], function(d) {return d.hour+':'+d.row})
    .join("rect")
    .attr("x", function(d) { return x(d.hour) })
    .attr("y", function(d) { return y(d.row) })
    .attr("rx", 4)
    .attr("ry", 4)
    .attr("width", x.bandwidth() )
    .attr("height", y.step() * 14 )
    .style("fill", "gray" )
    .style("stroke-width", 1)
    .style("pointer-events","none")
    .style("stroke","none")
    .style("opacity", 0.08)

  svg.selectAll()
    .data(data.filter(_.get('players')), function(d) {return d.hour+':'+d.row})
    .join("text")
    .attr("x", function(d) { return x(d.hour) + (x.bandwidth() / 2) - 8 })
    .attr("y", function(d) { return y(d.row) + 18 })
    .attr("width", 1 )
    .style("pointer-events","none")
    .attr("height", 1 )
    .style("opacity",function(d) { return d.players?.find(({player}) => player === currentUser?.id) ? 1 : 0 })
    .attr('font-family', 'fontello')
    .attr('font-size', function(d) { return '16px'} )
    .text('\ue800');

  return items
}