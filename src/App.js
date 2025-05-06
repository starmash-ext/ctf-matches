import './App.css';
import React from "react";
import ReactApexChart from 'react-apexcharts'

function App() {
  const [state, setState] = React.useState({

    series: [
      {
        name: 'Metric1',
        data: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24]
      },
      {
        name: 'Metric2',
        data: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24]
      },
      {
        name: 'Metric2',
        data: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24]
      },
      {
        name: 'Metric2',
        data: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24]
      },
      {
        name: 'Metric2',
        data: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24]
      },
      {
        name: 'Metric2',
        data: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24]
      },
      {
        name: 'Metric2',
        data: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24]
      },
    ],
    options: {
      chart: {
        height: 350,
        type: 'heatmap',
        events: {
          mouseMove: function(event, chartContext, opts) {
            console.log(event,chartContext,opts)
            // The last parameter opts contains additional information like `seriesIndex` and `dataPointIndex` for cartesian charts.
          }
        }
      },
      tooltip: {
        custom: function({series, seriesIndex, dataPointIndex, w}) {
          return '<div class="arrow_box">' +
            '<span>' + series[seriesIndex][dataPointIndex] + '</span>' +
            '</div>'
        }
      },
      dataLabels: {
        enabled: false
      },
      colors: ["#8a0000"],
    },

  });



  return (
    <div>
      <div id="chart">
        <ReactApexChart options={state.options} series={state.series} type="heatmap" height={350} />
      </div>
      <div id="html-dist"></div>
    </div>
  );
}

export default App;
