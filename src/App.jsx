import './App.css';
import React, {Suspense, useReducer} from "react";
import axios from "axios";
import {HourlyHeatmap} from "./HourlyHeatmap";
import {SERVER_URL} from "./constants";
import {getJwtUser} from "./utils.jsx";
import {LoggedUserInfo} from "./LoggedUserInfo.jsx";

function App() {
  const peaksPromise = axios.get(SERVER_URL + "/listpeaks")
  const refreshInterface = useReducer(() => ({}), {})[1]
  return <Suspense fallback={null}>
    <HourlyHeatmap peaksPromise={peaksPromise} onCreateUser={refreshInterface} />
    {getJwtUser() && <LoggedUserInfo onSuccess={refreshInterface}/>}
  </Suspense>
}

export default App;
