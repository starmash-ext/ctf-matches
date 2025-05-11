import './App.css';
import React, {Suspense} from "react";
import axios from "axios";
import {HourlyHeatmap} from "./HourlyHeatmap";
import {SERVER_URL} from "./constants";

function App() {
  const peaksPromise = axios.get(SERVER_URL + "/listpeaks")

  return <Suspense fallback={null}>
    <HourlyHeatmap peaksPromise={peaksPromise} />
  </Suspense>
}

export default App;
