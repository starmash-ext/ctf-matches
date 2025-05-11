import _ from 'lodash/fp'

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
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
]
const RELATIVE_DAY_LABEL = {
  '9': 'Day after tomorrow',
  '8': 'Tomorrow',
  '7': 'Today',
  '6': 'Yesterday'
}
const SMALL_DAY_LABEL = {
  'Sunday': 'Sun',
  'Monday': 'Mon',
  'Tuesday': 'Tue',
  'Wednesday': 'Wed',
  'Thursday': 'Thu',
  'Friday': 'Fri',
  'Saturday': 'Sat',
  'Tomorrow': 'Tmrw',
  'Today': 'Today',
  'Yesterday': 'Yday',
  'Day after tomorrow': 'Omrw'
}

export const createSeries = (hourlyPeaks) => {
  const today = new Date()
  today.setHours(0,0,0,0)
  const startAt = today.getTime() - (7 * DAY)
  const data = _.times(day => {
    const currentDay = (startAt + (day * DAY))
    const currentDate = new Date(currentDay)
    return ({
      row: day,
      day:
        RELATIVE_DAY_LABEL[day] ||
        WEEKDAY_LABELS[currentDate.getDay()],
      values: _.times(hour => {
        const currentTime = (currentDate.getTime() + (hour * HOUR))
        if (currentTime > Date.now()) {
          return {
            date: currentTime,
            hour,
            value: 0
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
  },10)

  return {
    columns:_.times(_.identity,24),
    rows: data.map(_.get('row')),
    rowNames: data.map(({day})=>SMALL_DAY_LABEL[day]),
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