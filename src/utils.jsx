import _ from 'lodash/fp'
import {jwtDecode} from 'jwt-decode'
export const MINUTE = 60 * 1000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;
function getTimezoneOffsetForLongName(timeZone) {
  const str = new Date().toLocaleString('en', {timeZone, timeZoneName: 'longOffset'});
  const [_, h, m] = str.match(/([+-]\d+):(\d+)$/) || [, '+00', '00'];
  return h * 60 + (h > 0 ? +m : -m);
}

getTimezoneOffsetForLongName("EST")

const WEEKDAY_LABELS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday"
]
const RELATIVE_DAY_LABEL = {
  '9': 'the day after tomorrow',
  '8': 'tomorrow',
  '7': 'today',
  '6': 'yesterday'
}
const SMALL_DAY_LABEL = {
  'sunday': 'Sun',
  'monday': 'Mon',
  'tuesday': 'Tue',
  'wednesday': 'Wed',
  'thursday': 'Thu',
  'friday': 'Fri',
  'saturday': 'Sat',
  'tomorrow': 'Tmrw',
  'today': 'Today',
  'yesterday': 'Yday',
  'the day after tomorrow': 'Omrw'
}

export const createSeries = (hourlyPeaks,futures) => {
  const today = new Date()
  const futurePlaysMap = _.groupBy(_.get('datetime'),futures)
  today.setHours(0,0,0,0)
  const startAt = today.getTime() - (7 * DAY)
  const data = _.times(day => {
    const currentDay = (startAt + (day * DAY))
    const currentDate = new Date(currentDay)
    const dayMonth = currentDate.toLocaleDateString(undefined, {month:"numeric",day:"numeric"})
    return ({
      row: day,
      dayMonth,
      day:
        RELATIVE_DAY_LABEL[day] ||
        WEEKDAY_LABELS[currentDate.getDay()],
      values: _.times(hour => {
        const currentTime = (currentDate.getTime() + (hour * HOUR))
        if (currentTime > Date.now()) {
          const futurePlays = futurePlaysMap[currentTime/1000]
          return {
            date: currentTime,
            hour,
            players: futurePlays,
            value: futurePlays?.length || 0
          }
        } else {
          return {
            hour,
            date: currentTime,
            value: hourlyPeaks.find(({datetime}) =>
              (datetime * 1000) === (currentDate.getTime() + (hour * HOUR))
            )?.playing || 0
          }
        }
      },24)
    })
  },14)

  return {
    columns:_.times(_.identity,24),
    rows: data.map(_.get('row')),
    rowNames: data.map(({row,dayMonth})=> row === 7 ? "Today" : dayMonth ),
    data: data.flatMap(({day,values, row}) => values.map(({hour,value,...rest}) =>
      ({
        row,
        daySmall: SMALL_DAY_LABEL[day],
        day,
        hour,
        easternHour: getEasternTime(rest.date,hour),
        value,
        ...rest
      })))
  }
}

export const getEasternTime = (date, userHour) => {
  function getEasternTimeStatus() {
    const now = new Date();

    // Create a DateTimeFormat object for the US Eastern time zone
    const options = {
      timeZone: 'America/New_York',
      timeZoneName: 'short'
    };
    const formatter = new Intl.DateTimeFormat('en-US', options);

    // Format the date to get the time zone abbreviation
    const parts = formatter.formatToParts(now);
    const timeZoneName = parts.find(part => part.type === 'timeZoneName')?.value;

    if (timeZoneName === 'EDT') {
      return 'EDT';
    } else if (timeZoneName === 'EST') {
      return 'EST';
    } else {
      return `EST`;
    }
  }

  const USTimezone = getEasternTimeStatus()
  const UShour = (24 + new Date(date).getUTCHours() - (USTimezone === 'EDT' ? 4 : 5)) % 24
  if (userHour!==UShour) {
    return ` (${UShour}h ${USTimezone})`
  }
}

export const getJwtUser = () => {
  try {
    return jwtDecode(localStorage.getItem("jwt"))
  } catch (e) {
    return null
  }
}
