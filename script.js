//////////////////////////////////////////////////////////
// GLOBAL VARIABLES
//////////////////////////////////////////////////////////

let uploadedData = [];

let currentX = [];
let currentY = [];

let fittedParameters = {};

//////////////////////////////////////////////////////////
// INITIALIZATION
//////////////////////////////////////////////////////////

window.onload = function () {

    document
        .getElementById("distribution")
        .addEventListener(
            "change",
            updateDistribution
        );

    const controls =
        document.querySelectorAll(
            "input, select"
        );

    controls.forEach(control => {

    control.addEventListener(
        "input",
        autoUpdate
    );

});

    autoUpdate();
};

//////////////////////////////////////////////////////////
// UPDATE DISTRIBUTION
//////////////////////////////////////////////////////////

function updateDistribution() {

    const distribution =
        document.getElementById(
            "distribution"
        ).value;

    if (distribution === "uniform") {

        drawUniform();

    }

    else if (
        distribution === "triangular"
    ) {

        drawTriangular();

    }

    else if (
        distribution === "linear"
    ) {

        drawLinear();

    }

    else if (
        distribution === "piecewise"
    ) {

        drawPiecewise();

    }

    else if (
        distribution === "normal"
    ) {

        drawNormal();

    }

}

//////////////////////////////////////////////////////////
// CSV READER
//////////////////////////////////////////////////////////

document
.getElementById("fileInput")
.addEventListener(

    "change",

    function(event) {

        const file =
            event.target.files[0];

        if (!file) return;

        const reader =
            new FileReader();

        reader.onload =
        function(e) {

            const text =
                e.target.result;

            processCSV(text);

        };

        reader.readAsText(file);

    }

);

//////////////////////////////////////////////////////////
// PROCESS CSV
//////////////////////////////////////////////////////////

function processCSV(csvText) {

    uploadedData = [];

    const rows =
        csvText.split(/\r?\n/);

    rows.forEach(row => {

        const values =
            row.split(",");

        values.forEach(value => {

            const number =
                parseFloat(value);

            if (
                !isNaN(number)
            ) {

                uploadedData.push(
                    number
                );

            }

        });

    });

    if (
        uploadedData.length === 0
    ) {

        alert(
            "No numerical values found."
        );

        return;
    }

    createHistogram();
}

//////////////////////////////////////////////////////////
// HISTOGRAM
//////////////////////////////////////////////////////////

function createHistogram() {

    Plotly.newPlot(

        "histogram",

        [

            {

                x: uploadedData,

                type:
                "histogram",

                opacity: 0.7,

                name:
                "Dataset"

            }

        ],

        {

            title:
            "Uploaded Dataset Histogram",

            xaxis: {

                title:
                "Value"

            },

            yaxis: {

                title:
                "Frequency"

            }

        }

    );

}

//////////////////////////////////////////////////////////
// FIT DISTRIBUTION
//////////////////////////////////////////////////////////

function fitDistribution() {

    if (uploadedData.length === 0) {

        alert(
            "Please upload a CSV file first."
        );

        return;
    }

    const distribution =

        document.getElementById(
            "fitDistributionType"
        ).value;

    if (distribution === "uniform") {

        fitUniform();

    }

    else if (
        distribution === "normal"
    ) {

        fitNormal();

    }

    else if (
        distribution === "triangular"
    ) {

        fitTriangular();

    }

    else if (
        distribution === "linear"
    ) {

        fitLinear();

    }

    else if (
        distribution === "piecewise"
    ) {

        fitPiecewise();

    }

}

//////////////////////////////////////////////////////////
// BASIC STATISTICS
//////////////////////////////////////////////////////////

function getMean(data) {

    return data.reduce(

        (a,b) => a + b

    ,0) / data.length;

}

function getMin(data) {

    return Math.min(...data);

}

function getMax(data) {

    return Math.max(...data);

}

function getStd(data) {

    const mean =
        getMean(data);

    const variance =

        data.reduce(

            (sum,value) =>

            sum +
            Math.pow(
                value - mean,
                2
            ),

            0

        )

        / data.length;

    return Math.sqrt(
        variance
    );

}


//////////////////////////////////////////////////////////
// FIT UNIFORM
//////////////////////////////////////////////////////////

function fitUniform() {

    const min =
        getMin(uploadedData);

    const max =
        getMax(uploadedData);

    fittedParameters = {

        min: min,
        max: max

    };

    document.getElementById(
        "parametersText"
    ).innerHTML =

        "Minimum = "
        + min.toFixed(2)

        +

        "<br>Maximum = "

        + max.toFixed(2);

    document.getElementById(
        "interpretationText"
    ).innerHTML =

        "Uniform fit assumes all values are equally likely between the minimum and maximum observed values.";

    drawFittedUniform(
        min,
        max
    );

}

//////////////////////////////////////////////////////////
// FIT NORMAL
//////////////////////////////////////////////////////////

function fitNormal() {

    const mean =
        getMean(uploadedData);

    const std =
        getStd(uploadedData);

    fittedParameters = {

        mean: mean,
        std: std

    };

    document.getElementById(
        "parametersText"
    ).innerHTML =

        "Mean = "
        + mean.toFixed(2)

        +

        "<br>Standard Deviation = "

        + std.toFixed(2);

    document.getElementById(
        "interpretationText"
    ).innerHTML =

        "Normal distributions are reasonable when data cluster around a central value with roughly symmetric variation.";

    drawFittedNormal(
        mean,
        std
    );

}

//////////////////////////////////////////////////////////
// FIT TRIANGULAR
//////////////////////////////////////////////////////////

function fitTriangular() {

    const min =
        getMin(uploadedData);

    const max =
        getMax(uploadedData);

    const mean =
        getMean(uploadedData);

    const mode =
        3 * mean
        - min
        - max;

    fittedParameters = {

        min: min,
        max: max,
        mode: mode

    };

    document.getElementById(
        "parametersText"
    ).innerHTML =

        "Minimum = "
        + min.toFixed(2)

        +

        "<br>Maximum = "

        + max.toFixed(2)

        +

        "<br>Mode = "

        + mode.toFixed(2);

    document.getElementById(
        "interpretationText"
    ).innerHTML =

        "Triangular distributions are useful when values concentrate around one most likely point.";

    drawFittedTriangular(
        min,
        max,
        mode
    );

}

//////////////////////////////////////////////////////////
// FIT LINEAR
//////////////////////////////////////////////////////////

function fitLinear() {

    const min =
        getMin(uploadedData);

    const max =
        getMax(uploadedData);

    fittedParameters = {

        min: min,
        max: max

    };

    document.getElementById(
        "parametersText"
    ).innerHTML =

        "Lower Bound = "
        + min.toFixed(2)

        +

        "<br>Upper Bound = "

        + max.toFixed(2);

    document.getElementById(
        "interpretationText"
    ).innerHTML =

        "Linear distributions model steadily increasing or decreasing likelihood across an interval.";

    drawFittedLinear(
        min,
        max
    );

}

//////////////////////////////////////////////////////////
// FIT PIECEWISE
//////////////////////////////////////////////////////////

function fitPiecewise() {

    const min =
        getMin(uploadedData);

    const max =
        getMax(uploadedData);

    const range =
        max - min;

    const break1 =
        min + range / 3;

    const break2 =
        min + 2 * range / 3;

    fittedParameters = {

        min,
        max,
        break1,
        break2

    };

    document.getElementById(
        "parametersText"
    ).innerHTML =

        "Break 1 = "
        + break1.toFixed(2)

        +

        "<br>Break 2 = "

        + break2.toFixed(2);

    document.getElementById(
        "interpretationText"
    ).innerHTML =

        "Piecewise distributions model different behaviors over separate intervals.";

    drawFittedPiecewise(
        min,
        max,
        break1,
        break2
    );

}


//////////////////////////////////////////////////////////
// FITTED UNIFORM PDF
//////////////////////////////////////////////////////////

function drawFittedUniform(min, max) {

    let x = [];
    let y = [];

    let height =
        1 / (max - min);

    for (
        let i = min;
        i <= max;
        i += 0.1
    ) {

        x.push(i);

        y.push(height);

    }

    drawHistogramAndPDF(
        x,
        y,
        "Uniform Fit"
    );

}

//////////////////////////////////////////////////////////
// FITTED NORMAL PDF
//////////////////////////////////////////////////////////

function drawFittedNormal(
    mean,
    std
) {

    let x = [];
    let y = [];

    for (
        let i = mean - 4 * std;
        i <= mean + 4 * std;
        i += 0.1
    ) {

        x.push(i);

        y.push(
            normalPDF(
                i,
                mean,
                std
            )
        );

    }

    drawHistogramAndPDF(
        x,
        y,
        "Normal Fit"
    );

}

//////////////////////////////////////////////////////////
// FITTED TRIANGULAR PDF
//////////////////////////////////////////////////////////

function drawFittedTriangular(
    a,
    b,
    c
) {

    let x = [];
    let y = [];

    for (
        let i = a;
        i <= b;
        i += 0.1
    ) {

        x.push(i);

        if (i <= c) {

            y.push(

                (2 * (i - a))

                /

                (
                    (b - a)
                    *
                    (c - a)
                )

            );

        }

        else {

            y.push(

                (2 * (b - i))

                /

                (
                    (b - a)
                    *
                    (b - c)
                )

            );

        }

    }

    drawHistogramAndPDF(
        x,
        y,
        "Triangular Fit"
    );

}


//////////////////////////////////////////////////////////
// FITTED LINEAR PDF
//////////////////////////////////////////////////////////

function drawFittedLinear(
    min,
    max
) {

    let x = [];
    let y = [];

    let range =
        max - min;

    for (
        let i = min;
        i <= max;
        i += 0.1
    ) {

        x.push(i);

        y.push(

            2 *
            (
                i - min
            )

            /

            Math.pow(
                range,
                2
            )

        );

    }

    drawHistogramAndPDF(
        x,
        y,
        "Linear Fit"
    );

}

//////////////////////////////////////////////////////////
// FITTED PIECEWISE PDF
//////////////////////////////////////////////////////////

function drawFittedPiecewise(
    min,
    max,
    break1,
    break2
) {

    let x = [];
    let y = [];

    for (
        let i = min;
        i <= max;
        i += 0.1
    ) {

        x.push(i);

        if (i < break1) {

            y.push(0.1);

        }

        else if (
            i < break2
        ) {

            y.push(0.3);

        }

        else {

            y.push(0.1);

        }

    }

    drawHistogramAndPDF(
        x,
        y,
        "Piecewise Fit"
    );

}
//////////////////////////////////////////////////////////
// HISTOGRAM + PDF
//////////////////////////////////////////////////////////

function drawHistogramAndPDF(
    x,
    y,
    title
) {

    let histogram = {

        x: uploadedData,

        type:
        "histogram",

        histnorm:
        "probability density",

        opacity: 0.6,

        name:
        "Dataset"

    };

    let pdf = {

        x: x,

        y: y,

        type:
        "scatter",

        mode:
        "lines",

        line: {

            width: 3

        },

        name:
        title

    };

    Plotly.newPlot(

        "histogram",

        [

            histogram,

            pdf

        ],

        {

            title:
            "Histogram + Fitted PDF",

            xaxis: {

                title:
                "Value"

            },

            yaxis: {

                title:
                "Density"

            }

        }

    );

}


//////////////////////////////////////////////////////////
// PDF VALUE
//////////////////////////////////////////////////////////

function pdfValue(x) {

    const distribution =

        document.getElementById(
            "distribution"
        ).value;

    //////////////////////////////////////////////////////
    // UNIFORM
    //////////////////////////////////////////////////////

    if (distribution === "uniform") {

        const a =
            parseFloat(
                document.getElementById("a").value
            );

        const b =
            parseFloat(
                document.getElementById("b").value
            );

        if (
            x >= a &&
            x <= b
        ) {

            return 1 / (b - a);

        }

        return 0;
    }

    //////////////////////////////////////////////////////
    // TRIANGULAR
    //////////////////////////////////////////////////////

    if (
        distribution === "triangular"
    ) {

        const a =
            parseFloat(
                document.getElementById("a").value
            );

        const b =
            parseFloat(
                document.getElementById("b").value
            );

        const c =
            parseFloat(
                document.getElementById("mode").value
            );

        if (
            x < a ||
            x > b
        ) {

            return 0;
        }

        if (x <= c) {

            return (
                2 * (x - a)
            ) /
            (
                (b - a)
                *
                (c - a)
            );

        }

        return (
            2 * (b - x)
        ) /
        (
            (b - a)
            *
            (b - c)
        );
    }

    //////////////////////////////////////////////////////
    // LINEAR
    //////////////////////////////////////////////////////

    if (
        distribution === "linear"
    ) {

        const a =
            parseFloat(
                document.getElementById("a").value
            );

        const b =
            parseFloat(
                document.getElementById("b").value
            );

        const range =
            b - a;

        if (
            x < a ||
            x > b
        ) {

            return 0;
        }

        return

        2 *
        (x - a)

        /

        Math.pow(
            range,
            2
        );

    }

    //////////////////////////////////////////////////////
    // PIECEWISE
    //////////////////////////////////////////////////////

    if (
        distribution === "piecewise"
    ) {

        const a =
            parseFloat(
                document.getElementById("a").value
            );

        const b =
            parseFloat(
                document.getElementById("b").value
            );

        const break1 =
            parseFloat(
                document.getElementById("break1").value
            );

        const break2 =
            parseFloat(
                document.getElementById("break2").value
            );

    // Outside interval
        if (
            x < a ||
            x > b
        ) {

            return 0;

        }

        if (x < break1) {

            return 0.1;

        }

        else if (x < break2) {

            return 0.3;

        }

        else {

            return 0.1;

        }

    }

    //////////////////////////////////////////////////////
    // NORMAL
    //////////////////////////////////////////////////////

    if (
        distribution === "normal"
    ) {

        const mean =
            parseFloat(
                document.getElementById("mean").value
            );

        const std =
            parseFloat(
                document.getElementById("std").value
            );

        return normalPDF(
            x,
            mean,
            std
        );

    }

    return 0;

}

//////////////////////////////////////////////////////////
// NUMERICAL INTEGRATION
//////////////////////////////////////////////////////////

function integratePDF(
    start,
    end
) {

    let area = 0;

    const step = 0.01;

    for (
        let x = start;
        x < end;
        x += step
    ) {

        area +=

            pdfValue(x)

            *

            step;

    }

    return area;

}

//////////////////////////////////////////////////////////
// CALCULATE PROBABILITY
//////////////////////////////////////////////////////////

function calculateProbability() {

    const type =

        document.getElementById(
            "probabilityType"
        ).value;

    let x1 =

        parseFloat(
            document.getElementById("x1").value
        );

    let x2 =

        parseFloat(
            document.getElementById("x2").value
        );

    let probability = 0;

    if (type === "below") {

        probability =

            integratePDF(
                -100,
                x1
            );

        shadeProbability(
            -100,
            x1
        );

    }

    else if (
        type === "above"
    ) {

        probability =

            integratePDF(
                x1,
                100
            );

        shadeProbability(
            x1,
            100
        );

    }

    else {

        probability =

            integratePDF(
                x1,
                x2
            );

        shadeProbability(
            x1,
            x2
        );

    }

    document
        .getElementById("result")
        .innerHTML =

        "Probability = "

        +

        probability.toFixed(4);

}
//////////////////////////////////////////////////////////
// SHADED REGION
//////////////////////////////////////////////////////////

function shadeProbability(
    start,
    end
) {

    let curveX = [];
    let curveY = [];

    let shadeX = [];
    let shadeY = [];

    for (
        let x = -20;
        x <= 20;
        x += 0.05
    ) {

        let y =
            pdfValue(x);

        curveX.push(x);
        curveY.push(y);

        if (
            x >= start &&
            x <= end
        ) {

            shadeX.push(x);
            shadeY.push(y);

        }

    }

    let curve = {

        x: curveX,

        y: curveY,

        type: "scatter",

        fill: "tozeroy",

        name: "PDF"

    };

    let shaded = {

        x: shadeX,

        y: shadeY,

        type: "scatter",

        fill: "tozeroy",

        name: "Probability Area"

    };

    let lowerLine = {

    x: [start, start],

    y: [0, Math.max(...curveY)],

    type: "scatter",

    mode: "lines",

    name: "Lower Bound"

};

let upperLine = {

    x: [end, end],

    y: [0, Math.max(...curveY)],

    type: "scatter",

    mode: "lines",

    name: "Upper Bound"

};

    Plotly.newPlot(

        "graph",

        [

            curve,
            shaded,
            lowerLine,
            upperLine

        ],

        {

            title: "Probability Region",

            hovermode: "x unified",

            annotations: [

                {

                    x:
                    (start + end) / 2,

                    y:
                    Math.max(...curveY),

                    text:
                    "Selected Area",

                    showarrow: true

                }

            ]

        },

        {

            responsive: true,

            displayModeBar: true,

            scrollZoom: true

        }

    );

}

//////////////////////////////////////////////////////////
// GRAPH DISTRIBUTION
//////////////////////////////////////////////////////////

function graphDistribution(
    x,
    y,
    title
) {

    currentX = x;
    currentY = y;

    let trace = {

        x: x,

        y: y,

        type: "scatter",

        mode: "lines",

        fill: "tozeroy",

        hovertemplate:

            "x = %{x:.2f}<br>" +

            "PDF = %{y:.4f}" +

            "<extra></extra>",

        name: title

    };

    Plotly.newPlot(

        "graph",

        [trace],

        {

            title: title,

            hovermode: "x unified",

            xaxis: {
                title: "x"
            },

            yaxis: {
                title: "f(x)"
            }

        },

        {

            responsive: true,

            displayModeBar: true,

            scrollZoom: true,

            modeBarButtonsToAdd: [

                "select2d",

                "lasso2d"

            ]

        }

    );
    document
    .getElementById("graph")
    .on(

        "plotly_click",

        function(data){

            let clickedX =

                data.points[0].x;

            document
            .getElementById("x1")
            .value =

                clickedX.toFixed(2);

            calculateProbability();

        }

    );
    document
    .getElementById("graph")
    .on(

        "plotly_doubleclick",

        function(data){

            return false;

        }

    );
    document
    .getElementById("graph")
    .addEventListener(

        "dblclick",

        function(){

            let x2 = prompt(

                "Enter x2 value"

            );

            if(x2 !== null){

                document
                .getElementById("x2")
                .value = x2;

                calculateProbability();

            }

        }

    );

}

//////////////////////////////////////////////////////////
// NORMAL PDF
//////////////////////////////////////////////////////////
function normalPDF(x, mean, std) {

    return (
        1 /
        (std * Math.sqrt(2 * Math.PI))
    ) *
    Math.exp(
        -0.5 *
        Math.pow(
            (x - mean) / std,
            2
        )
    );

}


//////////////////////////////////////////////////////////
// DRAW UNIFORM
//////////////////////////////////////////////////////////

function drawUniform() {

    let a =
        parseFloat(
            document.getElementById("a").value
        );

    let b =
        parseFloat(
            document.getElementById("b").value
        );

    if (b <= a) {

        alert(
            "Upper bound must be greater than lower bound."
        );

        return;
    }

    let x = [];
    let y = [];

    let h =
        1 / (b - a);

    for (
        let i = a - 2;
        i <= b + 2;
        i += 0.05
    ) {

        x.push(i);

        if (
            i >= a &&
            i <= b
        ) {

            y.push(h);

        }

        else {

            y.push(0);

        }

    }

    graphDistribution(
        x,
        y,
        "Uniform Distribution"
    );

}

//////////////////////////////////////////////////////////
// DRAW TRIANGULAR
//////////////////////////////////////////////////////////

function drawTriangular() {

    let a =
        parseFloat(
            document.getElementById("a").value
        );

    let b =
        parseFloat(
            document.getElementById("b").value
        );
    if (b <= a) {

        alert(
            "Upper bound must be greater than lower bound."
        );

        return;
    }

    let c =
        parseFloat(
            document.getElementById("mode").value
        );

    let x = [];
    let y = [];

    for (
        let i = a;
        i <= b;
        i += 0.05
    ) {

        x.push(i);

        if (i <= c) {

            y.push(

                (2 * (i - a))

                /

                (
                    (b - a)
                    *
                    (c - a)
                )

            );

        }

        else {

            y.push(

                (2 * (b - i))

                /

                (
                    (b - a)
                    *
                    (b - c)
                )

            );

        }

    }

    graphDistribution(
        x,
        y,
        "Triangular Distribution"
    );

}

//////////////////////////////////////////////////////////
// DRAW NORMAL
//////////////////////////////////////////////////////////

function drawNormal() {

    let mean =
        parseFloat(
            document.getElementById("mean").value
        );

    let std =
        parseFloat(
            document.getElementById("std").value
        );

    let x = [];
    let y = [];

    for (
        let i = mean - 4 * std;
        i <= mean + 4 * std;
        i += 0.05
    ) {

        x.push(i);

        y.push(
            normalPDF(
                i,
                mean,
                std
            )
        );

    }

    graphDistribution(
        x,
        y,
        "Normal Distribution"
    );

}

//////////////////////////////////////////////////////////
// DRAW LINEAR
//////////////////////////////////////////////////////////

function drawLinear() {

    let a =
        parseFloat(
            document.getElementById("a").value
        );

    let b =
        parseFloat(
            document.getElementById("b").value
        );
    if (b <= a) {

        alert(
            "Upper bound must be greater than lower bound."
        );

        return;
    }

    let slope =
        parseFloat(
            document.getElementById("slope").value
        );

    let x = [];
    let y = [];

    let totalArea = 0;

    for (
        let i = a;
        i <= b;
        i += 0.05
    ) {

        totalArea +=
            slope * (i - a) * 0.05;

    }

    for (
        let i = a;
        i <= b;
        i += 0.05
    ) {

        x.push(i);

        y.push(

            slope *
            (i - a)

            /

            totalArea

        );

    }

    graphDistribution(
        x,
        y,
        "Linear Distribution"
    );

}

//////////////////////////////////////////////////////////
// DRAW PIECEWISE
//////////////////////////////////////////////////////////

function drawPiecewise() {

    let a =
        parseFloat(
            document.getElementById("a").value
        );

    let b =
        parseFloat(
            document.getElementById("b").value
        );
    if (b <= a) {

        alert(
            "Upper bound must be greater than lower bound."
        );

        return;
    }

    let break1 =
        parseFloat(
            document.getElementById("break1").value
        );

    let break2 =
        parseFloat(
            document.getElementById("break2").value
        );

    let x = [];
    let y = [];

    for (
        let i = a;
        i <= b;
        i += 0.05
    ) {

        x.push(i);

        if (
            i < break1
        ) {

            y.push(0.1);

        }

        else if (
            i < break2
        ) {

            y.push(0.3);

        }

        else {

            y.push(0.1);

        }

    }

    graphDistribution(
        x,
        y,
        "Piecewise Distribution"
    );

}

//////////////////////////////////////////////////////////
// AUTO UPDATE
//////////////////////////////////////////////////////////

function autoUpdate() {

    updateDistribution();

    calculateProbability();

}

