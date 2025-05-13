import React from 'react'
import {COUNTRY_CODE_TO_COUNTRY} from "./constants.jsx";

export const FlagIcon = ({code, size = 20}) => {
  return code && <img width={size} height={size} src={`/flags/flag_${COUNTRY_CODE_TO_COUNTRY[code]?.id}.png`}/>
}