//////////////////////////////////////////////////////////
// GLOBAL VARIABLES
//////////////////////////////////////////////////////////

let uploadedData = [];
let currentX = [];
let currentY = [];
let fittedParameters = {};
let autoUpdateTimer = null;  // for debouncing

//////////////////////////////////////////////////////////
// DEBOUNCE HELPER
//////////////////////////////////////////////////////////

function debounce(fn, delay) {
    return function(...args) {
        clearTimeout(autoUpdateTimer);
        autoUpdateTimer = setTimeout(() => fn(...args), delay);
    };
}

//////////////////////////////////////////////////////////
// INITIALIZATION
//////////////////////////////////////////////////////////

window.onload = function () {
    document
        .getElementById("distribution")
        .addEventListener("change", updateDistribution);

    const debouncedUpdate = debounce(autoUpdate, 300);

    const controls = document.querySelectorAll("input, select");
    controls.forEach(control => {
        control.addEventListener("input", debouncedUpdate);
    });

    autoUpdate();
};

//////////////////////////////////////////////////////////
// UPDATE DISTRIBUTION
//////////////////////////////////////////////////////////

function updateDistribution() {
    const distribution = document.getElementById("distribution").value;

    if      (distribution === "uniform")    { drawUniform();    }
    else if (distribution === "triangular") { drawTriangular(); }
    else if (distribution === "linear")     { drawLinear();     }
    else if (distribution === "piecewise")  { drawPiecewise();  }
    else if (distribution === "normal")     { drawNormal();     }
}

//////////////////////////////////////////////////////////
// CSV READER
//////////////////////////////////////////////////////////

document.getElementById("fileInput").addEventListener("change", function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        processCSV(e.target.result);
    };
    reader.readAsText(file);
});

//////////////////////////////////////////////////////////
// PROCESS CSV
//////////////////////////////////////////////////////////

function processCSV(csvText) {
    uploadedData = [];

    const rows = csvText.split(/\r?\n/);
    rows.forEach(row => {
        row.split(",").forEach(value => {
            const number = parseFloat(value);
            if (!isNaN(number)) {
                uploadedData.push(number);
            }
        });
    });

    if (uploadedData.length === 0) {
        alert("No numerical values found.");
        return;
    }

    createHistogram();
}

//////////////////////////////////////////////////////////
// HISTOGRAM
//////////////////////////////////////////////////////////

// If dataset is huge, sample it down so Plotly doesn't freeze
function sampleData(data, maxPoints = 2000) {
    if (data.length <= maxPoints) return data;
    const step = Math.ceil(data.length / maxPoints);
    return data.filter((_, i) => i % step === 0);
}

function createHistogram() {
    Plotly.newPlot(
        "histogram",
        [{
            x: sampleData(uploadedData),
            type: "histogram",
            opacity: 0.7,
            name: "Dataset"
        }],
        {
            title: "Uploaded Dataset Histogram",
            xaxis: { title: "Value" },
            yaxis: { title: "Frequency" }
        }
    );
}

//////////////////////////////////////////////////////////
// FIT DISTRIBUTION
//////////////////////////////////////////////////////////

function fitDistribution() {
    if (uploadedData.length === 0) {
        alert("Please upload a CSV file first.");
        return;
    }

    // Show a loading indicator so the user knows it's working
    document.getElementById("parametersText").innerHTML   = "Calculating...";
    document.getElementById("interpretationText").innerHTML = "";

    // Yield to the browser first, then run the heavy work
    setTimeout(() => {
        const distribution = document.getElementById("fitDistributionType").value;

        if      (distribution === "uniform")    { fitUniform();    }
        else if (distribution === "normal")     { fitNormal();     }
        else if (distribution === "triangular") { fitTriangular(); }
        else if (distribution === "linear")     { fitLinear();     }
        else if (distribution === "piecewise")  { fitPiecewise();  }
    }, 20);
}

//////////////////////////////////////////////////////////
// BASIC STATISTICS
//////////////////////////////////////////////////////////

function getMean(data) {
    return data.reduce((a, b) => a + b, 0) / data.length;
}

function getMin(data) {
    return Math.min(...data);
}

function getMax(data) {
    return Math.max(...data);
}

function getStd(data) {
    const mean = getMean(data);
    const variance = data.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / data.length;
    return Math.sqrt(variance);
}

//////////////////////////////////////////////////////////
// FIT UNIFORM
//////////////////////////////////////////////////////////

function fitUniform() {
    const min = getMin(uploadedData);
    const max = getMax(uploadedData);

    fittedParameters = { min, max };

    document.getElementById("parametersText").innerHTML =
        "Minimum = " + min.toFixed(2) + "<br>Maximum = " + max.toFixed(2);

    document.getElementById("interpretationText").innerHTML =
        "Uniform fit assumes all values are equally likely between the minimum and maximum observed values.";

    drawFittedUniform(min, max);
}

//////////////////////////////////////////////////////////
// FIT NORMAL
//////////////////////////////////////////////////////////

function fitNormal() {
    const mean = getMean(uploadedData);
    const std  = getStd(uploadedData);

    fittedParameters = { mean, std };

    document.getElementById("parametersText").innerHTML =
        "Mean = " + mean.toFixed(2) + "<br>Standard Deviation = " + std.toFixed(2);

    document.getElementById("interpretationText").innerHTML =
        "Normal distributions are reasonable when data cluster around a central value with roughly symmetric variation.";

    drawFittedNormal(mean, std);
}

//////////////////////////////////////////////////////////
// FIT TRIANGULAR
//////////////////////////////////////////////////////////

function fitTriangular() {
    const min  = getMin(uploadedData);
    const max  = getMax(uploadedData);
    const mean = getMean(uploadedData);
    const mode = 3 * mean - min - max;

    fittedParameters = { min, max, mode };

    document.getElementById("parametersText").innerHTML =
        "Minimum = " + min.toFixed(2) +
        "<br>Maximum = " + max.toFixed(2) +
        "<br>Mode = " + mode.toFixed(2);

    document.getElementById("interpretationText").innerHTML =
        "Triangular distributions are useful when values concentrate around one most likely point.";

    drawFittedTriangular(min, max, mode);
}

//////////////////////////////////////////////////////////
// FIT LINEAR
//////////////////////////////////////////////////////////

function fitLinear() {
    const min = getMin(uploadedData);
    const max = getMax(uploadedData);

    fittedParameters = { min, max };

    document.getElementById("parametersText").innerHTML =
        "Lower Bound = " + min.toFixed(2) + "<br>Upper Bound = " + max.toFixed(2);

    document.getElementById("interpretationText").innerHTML =
        "Linear distributions model steadily increasing or decreasing likelihood across an interval.";

    drawFittedLinear(min, max);
}

//////////////////////////////////////////////////////////
// FIT PIECEWISE
//////////////////////////////////////////////////////////

function fitPiecewise() {
    const min    = getMin(uploadedData);
    const max    = getMax(uploadedData);
    const range  = max - min;
    const break1 = min + range / 3;
    const break2 = min + 2 * range / 3;

    // FIXED: compute normalized heights so the area = 1
    const w1 = break1 - min;
    const w2 = break2 - break1;
    const w3 = max - break2;

    // Raw heights proportional to data density in each segment
    const count1 = uploadedData.filter(v => v < break1).length;
    const count2 = uploadedData.filter(v => v >= break1 && v < break2).length;
    const count3 = uploadedData.filter(v => v >= break2).length;
    const total  = uploadedData.length;

    // Density = proportion / width, then normalized so total area = 1
    let h1 = (count1 / total) / w1;
    let h2 = (count2 / total) / w2;
    let h3 = (count3 / total) / w3;

    // Guard against zero-width segments
    if (!isFinite(h1)) h1 = 0;
    if (!isFinite(h2)) h2 = 0;
    if (!isFinite(h3)) h3 = 0;

    fittedParameters = { min, max, break1, break2, h1, h2, h3 };

    document.getElementById("parametersText").innerHTML =
        "Break 1 = " + break1.toFixed(2) +
        "<br>Break 2 = " + break2.toFixed(2) +
        "<br>h1 = " + h1.toFixed(4) +
        "<br>h2 = " + h2.toFixed(4) +
        "<br>h3 = " + h3.toFixed(4);

    document.getElementById("interpretationText").innerHTML =
        "Piecewise distributions model different behaviors over separate intervals.";

    drawFittedPiecewise(min, max, break1, break2, h1, h2, h3);
}

//////////////////////////////////////////////////////////
// FITTED UNIFORM PDF
//////////////////////////////////////////////////////////

function drawFittedUniform(min, max) {
    let x = [];
    let y = [];
    const height = 1 / (max - min);

    for (let i = min; i <= max; i += 0.1) {
        x.push(i);
        y.push(height);
    }

    drawHistogramAndPDF(x, y, "Uniform Fit");
}

//////////////////////////////////////////////////////////
// FITTED NORMAL PDF
//////////////////////////////////////////////////////////

function drawFittedNormal(mean, std) {
    let x = [];
    let y = [];

    for (let i = mean - 4 * std; i <= mean + 4 * std; i += 0.1) {
        x.push(i);
        y.push(normalPDF(i, mean, std));
    }

    drawHistogramAndPDF(x, y, "Normal Fit");
}

//////////////////////////////////////////////////////////
// FITTED TRIANGULAR PDF
//////////////////////////////////////////////////////////

function drawFittedTriangular(a, b, c) {
    let x = [];
    let y = [];

    for (let i = a; i <= b; i += 0.1) {
        x.push(i);
        if (i <= c) {
            y.push((2 * (i - a)) / ((b - a) * (c - a)));
        } else {
            y.push((2 * (b - i)) / ((b - a) * (b - c)));
        }
    }

    drawHistogramAndPDF(x, y, "Triangular Fit");
}

//////////////////////////////////////////////////////////
// FITTED LINEAR PDF
//////////////////////////////////////////////////////////

function drawFittedLinear(min, max) {
    let x = [];
    let y = [];
    const range = max - min;

    for (let i = min; i <= max; i += 0.1) {
        x.push(i);
        y.push(2 * (i - min) / Math.pow(range, 2));
    }

    drawHistogramAndPDF(x, y, "Linear Fit");
}

//////////////////////////////////////////////////////////
// FITTED PIECEWISE PDF
//////////////////////////////////////////////////////////

function drawFittedPiecewise(min, max, break1, break2, h1, h2, h3) {
    let x = [];
    let y = [];

    for (let i = min; i <= max; i += 0.1) {
        x.push(i);
        if      (i < break1) { y.push(h1); }
        else if (i < break2) { y.push(h2); }
        else                  { y.push(h3); }
    }

    drawHistogramAndPDF(x, y, "Piecewise Fit");
}

//////////////////////////////////////////////////////////
// HISTOGRAM + PDF
//////////////////////////////////////////////////////////

function drawHistogramAndPDF(x, y, title) {
    const histogram = {
        x: sampleData(uploadedData),
        type: "histogram",
        histnorm: "probability density",
        opacity: 0.35,
        marker: { color: "#6b7cff" },
        name: "Observed Data"
    };

    const pdf = {
        x: x,
        y: y,
        type: "scatter",
        mode: "lines",
        line: { width: 4, color: "#5fffff" },
        name: title
    };

    Plotly.newPlot(
        "histogram",
        [histogram, pdf],
        {
            title: "Empirical Modeling",
            paper_bgcolor: "#071426",
            plot_bgcolor: "#071426",
            font: { color: "white" },
            xaxis: { title: "Value", gridcolor: "#1c3555" },
            yaxis: { title: "Density", gridcolor: "#1c3555" }
        },
        { responsive: true, displayModeBar: true, scrollZoom: true }
    );
}

//////////////////////////////////////////////////////////
// PDF VALUE  (used by probability calculator)
//////////////////////////////////////////////////////////

function pdfValue(x) {
    const distribution = document.getElementById("distribution").value;

    // UNIFORM
    if (distribution === "uniform") {
        const a = parseFloat(document.getElementById("a").value);
        const b = parseFloat(document.getElementById("b").value);
        return (x >= a && x <= b) ? 1 / (b - a) : 0;
    }

    // TRIANGULAR
    if (distribution === "triangular") {
        const a = parseFloat(document.getElementById("a").value);
        const b = parseFloat(document.getElementById("b").value);
        const c = parseFloat(document.getElementById("mode").value);

        if (x < a || x > b) return 0;
        if (x <= c) return (2 * (x - a)) / ((b - a) * (c - a));
        return (2 * (b - x)) / ((b - a) * (b - c));
    }

    // LINEAR — FIXED: return was split across lines causing ASI bug
    if (distribution === "linear") {
        const a     = parseFloat(document.getElementById("a").value);
        const b     = parseFloat(document.getElementById("b").value);
        const range = b - a;

        if (x < a || x > b) return 0;
        return 2 * (x - a) / Math.pow(range, 2);
    }

    // PIECEWISE — FIXED: now uses user-supplied (or fitted) heights
    if (distribution === "piecewise") {
        const a      = parseFloat(document.getElementById("a").value);
        const b      = parseFloat(document.getElementById("b").value);
        const break1 = parseFloat(document.getElementById("break1").value);
        const break2 = parseFloat(document.getElementById("break2").value);
        const h1     = parseFloat(document.getElementById("h1").value);
        const h2     = parseFloat(document.getElementById("h2").value);
        const h3     = parseFloat(document.getElementById("h3").value);

        if (x < a || x > b) return 0;
        if (x < break1) return h1;
        if (x < break2) return h2;
        return h3;
    }

    // NORMAL
    if (distribution === "normal") {
        const mean = parseFloat(document.getElementById("mean").value);
        const std  = parseFloat(document.getElementById("std").value);
        return normalPDF(x, mean, std);
    }

    return 0;
}

//////////////////////////////////////////////////////////
// NUMERICAL INTEGRATION
//////////////////////////////////////////////////////////

function integratePDF(start, end) {
    let area = 0;
    const step = 0.01; // 0.001 was too heavy and froze the browser

    for (let x = start; x < end; x += step) {
        area += pdfValue(x) * step;
    }

    return area;
}

//////////////////////////////////////////////////////////
// CALCULATE PROBABILITY
//////////////////////////////////////////////////////////

function calculateProbability() {
    const distribution = document.getElementById("distribution").value;
    const type = document.getElementById("probabilityType").value;

    const x1 = parseFloat(document.getElementById("x1").value);
    const x2 = parseFloat(document.getElementById("x2").value);

    // FIXED: use distribution-aware integration bounds instead of fixed ±100
    let lowerBound, upperBound;

    if (distribution === "normal") {
        const mean = parseFloat(document.getElementById("mean").value);
        const std  = parseFloat(document.getElementById("std").value);
        lowerBound = mean - 8 * std;
        upperBound = mean + 8 * std;
    } else {
        lowerBound = parseFloat(document.getElementById("a").value) - 1;
        upperBound = parseFloat(document.getElementById("b").value) + 1;
    }

    let probability = 0;

    if (type === "below") {
        probability = integratePDF(lowerBound, x1);
        shadeProbability(lowerBound, x1);
    } else if (type === "above") {
        probability = integratePDF(x1, upperBound);
        shadeProbability(x1, upperBound);
    } else {
        probability = integratePDF(x1, x2);
        shadeProbability(x1, x2);
    }

    document.getElementById("result").innerHTML =
        "Probability = " + probability.toFixed(4);
}

//////////////////////////////////////////////////////////
// SHADED REGION
//////////////////////////////////////////////////////////

function shadeProbability(start, end) {
    const distribution = document.getElementById("distribution").value;

    let plotMin, plotMax;

    if (distribution === "normal") {
        const mean = parseFloat(document.getElementById("mean").value);
        const std  = parseFloat(document.getElementById("std").value);
        plotMin = mean - 4 * std;
        plotMax = mean + 4 * std;
    } else {
        plotMin = parseFloat(document.getElementById("a").value) - 1;
        plotMax = parseFloat(document.getElementById("b").value) + 1;
    }

    let curveX = [];
    let curveY = [];
    let shadeX = [];
    let shadeY = [];

    for (let x = plotMin; x <= plotMax; x += 0.05) {
        const y = pdfValue(x);
        curveX.push(x);
        curveY.push(y);

        if (x >= start && x <= end) {
            shadeX.push(x);
            shadeY.push(y);
        }
    }

    const maxY = Math.max(...curveY);

    const curve = {
        x: curveX,
        y: curveY,
        type: "scatter",
        fill: "tozeroy",
        name: "PDF"
    };

    const shaded = {
        x: shadeX,
        y: shadeY,
        type: "scatter",
        fill: "tozeroy",
        name: "Probability Area"
    };

    const lowerLine = {
        x: [start, start],
        y: [0, maxY],
        type: "scatter",
        mode: "lines",
        name: "Lower Bound"
    };

    const upperLine = {
        x: [end, end],
        y: [0, maxY],
        type: "scatter",
        mode: "lines",
        name: "Upper Bound"
    };

    Plotly.newPlot(
        "graph",
        [curve, shaded, lowerLine, upperLine],
        {
            title: "Probability Region",
            hovermode: "x unified",
            annotations: [{
                x: (start + end) / 2,
                y: maxY,
                text: "Selected Area",
                showarrow: true
            }]
        },
        { responsive: true, displayModeBar: true, scrollZoom: true }
    );
}

//////////////////////////////////////////////////////////
// GRAPH DISTRIBUTION
//////////////////////////////////////////////////////////

function graphDistribution(x, y, title) {
    currentX = x;
    currentY = y;

    const trace = {
        x: x,
        y: y,
        type: "scatter",
        mode: "lines",
        fill: "tozeroy",
        hovertemplate: "x = %{x:.2f}<br>PDF = %{y:.4f}<extra></extra>",
        name: title
    };

    Plotly.newPlot(
        "graph",
        [trace],
        {
            title: title,
            hovermode: "x unified",
            xaxis: { title: "x" },
            yaxis: { title: "f(x)" }
        },
        {
            responsive: true,
            displayModeBar: true,
            scrollZoom: true,
            modeBarButtonsToAdd: ["select2d", "lasso2d"]
        }
    );

    // Click sets x1 and recalculates
    document.getElementById("graph").on("plotly_click", function(data) {
        const clickedX = data.points[0].x;
        document.getElementById("x1").value = clickedX.toFixed(2);
        calculateProbability();
    });

    // FIXED: removed prompt()-based double-click; x2 input is now always visible in the UI
}

//////////////////////////////////////////////////////////
// NORMAL PDF
//////////////////////////////////////////////////////////

function normalPDF(x, mean, std) {
    return (1 / (std * Math.sqrt(2 * Math.PI))) *
        Math.exp(-0.5 * Math.pow((x - mean) / std, 2));
}

//////////////////////////////////////////////////////////
// DRAW UNIFORM
//////////////////////////////////////////////////////////

function drawUniform() {
    const a = parseFloat(document.getElementById("a").value);
    const b = parseFloat(document.getElementById("b").value);

    if (b <= a) { alert("Upper bound must be greater than lower bound."); return; }

    const h = 1 / (b - a);
    let x = [];
    let y = [];

    for (let i = a - 2; i <= b + 2; i += 0.05) {
        x.push(i);
        y.push((i >= a && i <= b) ? h : 0);
    }

    graphDistribution(x, y, "Uniform Distribution");
}

//////////////////////////////////////////////////////////
// DRAW TRIANGULAR
//////////////////////////////////////////////////////////

function drawTriangular() {
    const a = parseFloat(document.getElementById("a").value);
    const b = parseFloat(document.getElementById("b").value);
    const c = parseFloat(document.getElementById("mode").value);

    if (b <= a) { alert("Upper bound must be greater than lower bound."); return; }

    let x = [];
    let y = [];

    for (let i = a; i <= b; i += 0.05) {
        x.push(i);
        if (i <= c) {
            y.push((2 * (i - a)) / ((b - a) * (c - a)));
        } else {
            y.push((2 * (b - i)) / ((b - a) * (b - c)));
        }
    }

    graphDistribution(x, y, "Triangular Distribution");
}

//////////////////////////////////////////////////////////
// DRAW NORMAL
//////////////////////////////////////////////////////////

function drawNormal() {
    const mean = parseFloat(document.getElementById("mean").value);
    const std  = parseFloat(document.getElementById("std").value);

    let x = [];
    let y = [];

    for (let i = mean - 4 * std; i <= mean + 4 * std; i += 0.05) {
        x.push(i);
        y.push(normalPDF(i, mean, std));
    }

    graphDistribution(x, y, "Normal Distribution");
}

//////////////////////////////////////////////////////////
// DRAW LINEAR
//////////////////////////////////////////////////////////

function drawLinear() {
    const a     = parseFloat(document.getElementById("a").value);
    const b     = parseFloat(document.getElementById("b").value);
    const slope = parseFloat(document.getElementById("slope").value);

    if (b <= a) { alert("Upper bound must be greater than lower bound."); return; }

    let x = [];
    let y = [];
    let totalArea = 0;

    for (let i = a; i <= b; i += 0.05) {
        totalArea += slope * (i - a) * 0.05;
    }

    for (let i = a; i <= b; i += 0.05) {
        x.push(i);
        y.push(slope * (i - a) / totalArea);
    }

    graphDistribution(x, y, "Linear Distribution");
}

//////////////////////////////////////////////////////////
// DRAW PIECEWISE
//////////////////////////////////////////////////////////

function drawPiecewise() {
    const a      = parseFloat(document.getElementById("a").value);
    const b      = parseFloat(document.getElementById("b").value);
    const break1 = parseFloat(document.getElementById("break1").value);
    const break2 = parseFloat(document.getElementById("break2").value);
    const h1     = parseFloat(document.getElementById("h1").value);
    const h2     = parseFloat(document.getElementById("h2").value);
    const h3     = parseFloat(document.getElementById("h3").value);

    if (b <= a) { alert("Upper bound must be greater than lower bound."); return; }

    let x = [];
    let y = [];

    for (let i = a; i <= b; i += 0.05) {
        x.push(i);
        if      (i < break1) { y.push(h1); }
        else if (i < break2) { y.push(h2); }
        else                  { y.push(h3); }
    }

    graphDistribution(x, y, "Piecewise Distribution");
}

//////////////////////////////////////////////////////////
// AUTO UPDATE
//////////////////////////////////////////////////////////

function autoUpdate() {
    updateDistribution();
    calculateProbability();
}

//////////////////////////////////////////////////////////
// SYNC PARAMETERS (fitted → simulation inputs)
//////////////////////////////////////////////////////////

function syncParameters() {
    if (fittedParameters.mean   !== undefined) { document.getElementById("mean").value   = fittedParameters.mean;   }
    if (fittedParameters.std    !== undefined) { document.getElementById("std").value    = fittedParameters.std;    }
    if (fittedParameters.min    !== undefined) { document.getElementById("a").value      = fittedParameters.min;    }
    if (fittedParameters.max    !== undefined) { document.getElementById("b").value      = fittedParameters.max;    }
    if (fittedParameters.mode   !== undefined) { document.getElementById("mode").value   = fittedParameters.mode;   }
    if (fittedParameters.break1 !== undefined) { document.getElementById("break1").value = fittedParameters.break1; }
    if (fittedParameters.break2 !== undefined) { document.getElementById("break2").value = fittedParameters.break2; }
    // FIXED: also sync piecewise heights
    if (fittedParameters.h1     !== undefined) { document.getElementById("h1").value     = fittedParameters.h1;     }
    if (fittedParameters.h2     !== undefined) { document.getElementById("h2").value     = fittedParameters.h2;     }
    if (fittedParameters.h3     !== undefined) { document.getElementById("h3").value     = fittedParameters.h3;     }

    updateDistribution();
}
