import React, {use, useEffect, useLayoutEffect, useRef, useState} from 'react'
import _ from 'lodash/fp'
import * as d3 from 'd3'
import {createSeries, getJwtUser} from "./utils";
import axios from "axios";
import {COUNTRY_CODE_TO_COUNTRY, SERVER_URL} from "./constants";
import {SignupModal} from "./SignupModal.jsx";

export const HourlyHeatmap = ({peaksPromise,onCreateUser}) => {
  const loadedData = use(peaksPromise).data
  const [peaks,setPeaks] = useState(loadedData.peaks)
  const [futures,setFutures] = useState(loadedData.futures)
  useEffect(() => {
    setPeaks(loadedData.peaks)
    setFutures(loadedData.futures)
  }, [peaksPromise]);
  const d3ref = useRef(null)
  const tooltipRef = useRef(null)
  const [showSignupModal, setShowSignupModal] = useState()

  const toggleUpdateSuccess = (date,data,updatedUser) => {
    const {futurePlay, jwt} = data
    setFutures(
      _.flow(
        _.filter(future => (future.datetime * 1000) !== date),
        _.concat(futurePlay)
      )
    )
    localStorage.setItem("jwt",jwt)
    if (updatedUser) {
      onCreateUser()
    }
  }

  const currentUser = getJwtUser()

  useLayoutEffect(() => {
// set the dimensions and margins of the graph
    const margin = {top: 80, right: 25, bottom: 30, left: 40},
      width = 650 - margin.left - margin.right,
      height = 450 - margin.top - margin.bottom;

// append the svg object to the body of the page
    const svg = d3.select(d3ref.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Add title to graph
    svg.append("text")
      .attr("x", 0)
      .attr("y", -50)
      .attr("text-anchor", "left")
      .style("font-size", "22px")
      .text("CTF matches calendar");

// Add subtitle to graph
    svg.append("text")
      .attr("x", 0)
      .attr("y", -20)
      .attr("text-anchor", "left")
      .style("font-size", "14px")
      .style("fill", "grey")
      .style("max-width", 400)
      .text("Next few days + Past week");

      const {rows,rowNames,columns,data} = createSeries(peaks,futures)

      // Labels of row and columns -> unique identifier of the column called 'group' and 'variable'

      // Build X scales and axis:
      const x = d3.scaleBand()
        .range([ 0, width ])
        .domain(columns)
        .padding(0.05);
      svg.append("g")
        .style("font-size", 15)
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x).tickSize(0).tickValues(d3.range(0, 24, 3)))
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

      // create a tooltip
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
      const mousemove = function(event,d) {
        tooltip
          .html(
            d.date < Date.now()
              ? `[${d.value}] players ${d.day}, ${d.hour}h${d.easternHour}`
              : d?.players
                ? `Players that hope to join ${d.day}, ${d.hour}h${d.easternHour}: 
              <ul>
                ${d.players.map(player => `<li style="word-break: keep-all">
                  ${player.flag ? `<img style="display: inline-block;" width=20 height=20 src='/flags/flag_${COUNTRY_CODE_TO_COUNTRY[player.flag]?.id}.png'/>` : ''} ${player.name}
                </li>`).join("")}
              </ul>
`
              : `No players scheduled for ${d.day}, ${d.hour}h${d.easternHour} yet. <b>Click to schedule</b>`
          )
          .style("left", (event.x) + "px")
          .style("top", (event.y) + "px")
      }
      const mouseleave = function(event,d) {
        tooltip
          .style("opacity", 0)
        d3.select(this)
          .style("stroke", "none")
          // .style("opacity", 0.8)
      }
      const click = async function(event,d) {
        if (d.date < Date.now()) return
        if (localStorage.getItem("jwt")) {
          const result = await axios.post(SERVER_URL + 'togglePresence', {jwt: localStorage.getItem("jwt"),date: d.date})
          toggleUpdateSuccess(d.date,result.data,false)
        } else {
          setShowSignupModal(d)
        }
      }

      // add the squares
      svg.selectAll()
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
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave)
        .on("click", click)

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
        .style("opacity", 0.1)

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

    return () => {
      svg.selectAll('*').remove();
    };

  },[futures,peaks] );

  return (
    <div>
      <div id="chart">
        <svg style={{height:"500px",width:"100%"}} ref={d3ref} />
      </div>
      <div id="html-dist"></div>
      <div ref={tooltipRef}/>
      <SignupModal show={showSignupModal} close={() => setShowSignupModal(undefined)} onSuccess={toggleUpdateSuccess}/>
    </div>
  );
}