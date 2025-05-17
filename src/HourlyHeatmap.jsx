import React, {use, useEffect, useLayoutEffect, useRef, useState} from 'react'
import _ from 'lodash/fp'
import * as d3 from 'd3'
import {createSeries, getJwtUser, hourToAMPM, wrapInfo} from "./utils";
import axios from "axios";
import {COUNTRY_CODE_TO_COUNTRY, SERVER_URL} from "./constants";
import {SignupModal} from "./SignupModal.jsx";
import {createHeatMap} from "./heatMap/createHeatMap.js";
import {createTooltip} from "./heatMap/createTooltip.js";

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
    const svg = d3.select(d3ref.current)
    const {rows,rowNames,columns,data} = createSeries(peaks,futures)


    const items = createHeatMap(svg, {rows,rowNames,columns,data,currentUser})
    const tooltip = createTooltip(tooltipRef,items)
    const mousemove = function(event,d) {
      const playersMayJoin = (withTime) => d?.players
        ? `<div>Players that intend to join${withTime ? ` ${d.day}, ${d.hour}${wrapInfo(d.easternHour)}` : ""}:</div>
              <ul>
                ${d.players.map(player => `<li style="word-break: keep-all">
                  ${player.flag ? `<img style="display: inline-block;" width=20 height=20 src='/flags/flag_${COUNTRY_CODE_TO_COUNTRY[player.flag]?.id}.png'/>` : ''} ${player.name}
                </li>`).join("")}
              </ul>
` : ''

      tooltip
        .html(
          d.date < Date.now()
            ? `[${d.value}] players ${d.day}, ${d.hour}${wrapInfo(d.easternHour)}
              ${playersMayJoin(false)}            
            `
            : d?.players
              ? playersMayJoin(true)
              : `No players scheduled for ${d.day}, ${d.hour}${wrapInfo(d.easternHour)} yet. <b>Click to schedule</b>`
        )
        .style("left", (event.x) + "px")
        .style("top", (event.y) + "px")
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
    items
      .on("mousemove", mousemove)
      .on("click", click)

    return () => {
      svg.selectAll('*').remove();
    };

  },[futures,peaks] );

  return (
    <div>
      <div id="chart">
        <svg style={{height:"405px",width:"100%"}} ref={d3ref} />
      </div>
      <div id="html-dist"></div>
      <div ref={tooltipRef}/>
      <SignupModal show={showSignupModal} close={() => setShowSignupModal(undefined)} onSuccess={toggleUpdateSuccess}/>
    </div>
  );
}