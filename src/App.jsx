import './App.css';
import React, {startTransition, Suspense, useEffect, useReducer, useState} from "react";
import axios from "axios";
import {HourlyHeatmap} from "./HourlyHeatmap";
import {SERVER_URL} from "./constants";
import {getJwtUser} from "./utils.jsx";
import {LoggedUserInfo} from "./LoggedUserInfo.jsx";

function App() {
  const [peaksPromise,setPeaksPromise] = useState(() => axios.get(SERVER_URL + "/listpeaks"))
  const resetPeaksPromise = () => startTransition(() => setPeaksPromise(axios.get(SERVER_URL + "/listpeaks")))
  useEffect(() => {
    const i = setInterval(resetPeaksPromise, 60000)
    return () => clearInterval(i)
  }, []);
  const refreshInterface = useReducer(() => ({}), {})[1]
  return <Suspense fallback={null}>
    <HourlyHeatmap peaksPromise={peaksPromise} onCreateUser={refreshInterface} />
    {getJwtUser() && <LoggedUserInfo onSuccess={() => {resetPeaksPromise(); refreshInterface()}}/>}
  </Suspense>
}

export default App;
