function makeRange(curIndex, curTuple) {
  curName = curTuple[0];
  curRange = curTuple[1];

  startIndex = Math.ceil( (curRange.length) / 2 ) - 1;

  curDivStr = "";
  curDivStr += `<div class="js-slider mt-5 sm:grid sm:grid-cols-5 sm:gap-4 sm:items-start">
      <label for="username" class="block text-sm font-medium leading-5 text-gray-700 sm:mt-px" style="text-align: center;">`;

  curDivStr += curName;
  curDivStr += `
      </label>
      <div class="mt-1 sm:mt-0 sm:col-span-3">
        <div class="flex rounded-md shadow-sm">
          <div class="js-slider__widget" style="width: 100%;"></div>
        </div>
      </div>
      <div>
        <span class="js-slider__value block text-sm font-medium leading-5 text-gray-700 sm:mt-px" style="text-align: center;"></span>
      </div>
    </div>
  `;

  $(".js-slider-form").append(curDivStr);

  return;
}

function makeSliders(cur_ranges, cur_defaults) {
  sliders = $(".js-slider");

  [].slice.call(sliders).forEach(function (slider, index) {
    curName = cur_ranges[index][0];
    curRange = cur_ranges[index][1];

    startIndex = curRange.indexOf(cur_defaults[index]);

    bigValueSlider = $(slider).find(".js-slider__widget")[0];

    noUiSlider.create(bigValueSlider, {
        start: startIndex,
        step: 1,
        format: wNumb({
          decimals: 0
        }),
        range: {
          min: 0,
          max: curRange.length - 1
        }
    });

    bigValueSlider.noUiSlider.on('update', function (values, handle) {
      tmpRange = cur_ranges[index][1];
      newValue = tmpRange[values[handle]];

      bigValueSpan = slider.getElementsByClassName("js-slider__value")[0];
      bigValueSpan.innerText = newValue;

      $(".js-slider-form").trigger("update_plotly")
    });
  });
}

var plotlyGlobal = undefined;

$(document).on('update_plotly', ".js-slider-form", function () {
  if ( typeof plotlyGlobal === "undefined" ) { return; }

  curPlotlyGlobal = new Array(globalPlotlyJson.ranges.length);

  $(".js-slider__value").each(function (curIndex) {
    curPlotlyGlobal[curIndex] = this.innerText;
  });

  plotlyGlobal = curPlotlyGlobal;

  updatePlotly();
});

function updatePlotly() {
  plotlyJson = globalPlotlyJson.plots;

  globalPlotlyJson.ranges.forEach(function (curTuple, curIndex) {
    globalKey = plotlyGlobal[curIndex];
    nestedJson = plotlyJson[globalKey];

    if ( typeof nestedJson === "undefined" ) {
      if ( parseInt(globalKey) == parseFloat(globalKey) ) {
        globalKey += ".0";
        nestedJson = plotlyJson[globalKey];
      }
    }
    plotlyJson = nestedJson;
  });

  Plotly.purge(curPlot);
  Plotly.plot(curPlot, cleanPlotlyJson(plotlyJson));
}

globalPlotlyJson = undefined;

$.getJSON("{{ card_data_path }}", function (curJson) {
  globalPlotlyJson = curJson;

  curPlotlyGlobal = new Array(curJson.ranges.length);

  plotlyJson = curJson.plots;

  curJson.ranges.forEach(function (curTuple, curIndex) {
    curRange = curTuple[1];

    if ( curTuple[0] in curJson.defaults ) {
      curPlotlyGlobal[curIndex] = curJson.defaults[curTuple[0]];
    } else {
      rangeIndex = Math.ceil( (curRange.length) / 2 ) - 1;
      curPlotlyGlobal[curIndex] = curRange[rangeIndex];
    }

    plotlyJson = plotlyJson[curPlotlyGlobal[curIndex]];
    makeRange(curIndex, curTuple)
  });

  makeSliders(curJson.ranges, curPlotlyGlobal)

  Plotly.plot(curPlot, cleanPlotlyJson(plotlyJson));
  plotlyGlobal = curPlotlyGlobal;
});

curPlot = document.getElementById('js-plot');

function cleanPlotlyJson(plotlyJson) {
  if ( "config" in plotlyJson ) {
    plotlyJson["config"] = $.merge(plotlyJson["config"], {responsive: true, displaylogo: false, modeBarButtonsToRemove: ["select2d", "lasso2d", "autoScale2d", "resetScale2d", "hoverClosestGl2d", "hoverClosestPie", "toggleHover", "resetViews", "sendDataToCloud", "toggleSpikelines", "resetViewMapbox", "hoverClosestCartesian", "hoverCompareCartesian"]});
  } else {
    plotlyJson["config"] = {responsive: true, displaylogo: false, modeBarButtonsToRemove: ["select2d", "lasso2d", "autoScale2d", "resetScale2d", "hoverClosestGl2d", "hoverClosestPie", "toggleHover", "resetViews", "sendDataToCloud", "toggleSpikelines", "resetViewMapbox", "hoverClosestCartesian", "hoverCompareCartesian"]};
  }

  plotlyJson["layout"]["dragmode"] = "pan";

  delete plotlyJson["layout"]["width"];
  delete plotlyJson["layout"]["height"];

  if ( "legend" in plotlyJson["layout"] ) {
    plotlyJson["layout"]["legend"]["orientation"] = "h";
    plotlyJson["layout"]["legend"]["xanchor"] = "middle";
    plotlyJson["layout"]["legend"]["yanchor"] = "top";
    plotlyJson["layout"]["legend"]["y"] = -0.15;
    plotlyJson["layout"]["legend"]["x"] = +0.15;
  }

  return plotlyJson;
}
