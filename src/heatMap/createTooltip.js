import * as d3 from "d3";

export const createTooltip = (tooltipRef,items) => {
  const tooltip = d3.select(tooltipRef.current)
    .style("opacity", 0)
    .style("position","absolute")
    .style("pointer-events","none")
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "2px")
    .style("border-radius", "5px")
    .style("padding", "5px")

  // Three function that change the tooltip when user hover / move / leave a cell
  const mouseover = function(event,d) {
    tooltip
      .style("opacity", 1)
    d3.select(this)
      .style("stroke", "black")
      .style("opacity", 1)
  }
  const mouseleave = function(event,d) {
    tooltip
      .style("opacity", 0)
    d3.select(this)
      .style("stroke", "none")
    // .style("opacity", 0.8)
  }

  items
    .on("mouseover", mouseover)
    .on("mouseleave", mouseleave)
  return tooltip
}