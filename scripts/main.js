/// <reference path="jquery-3.6.0.js" />
/// <reference path="storage.js" />
/// <reference path="parally.js" />

// ==================================================== Global ========================================
$(() => {
    route('home');
});

function AjaxGetRequestAsync(url) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            $.ajax({
                url: url,
                success: data => resolve(data),
                error: err => {
                    console.error(err);
                    reject(err);
                }
            });
        }, 1);
    });
}

function route(pageId) {
    let url;
    let loadFunc;
    let pageTitle;
    switch (pageId) {
        case 'home':
            url = 'templates/home-main.html';
            loadFunc = homeLoadFunc;
            pageTitle = "Home";
            break;
        case 'about':
            url = 'templates/about-main.html';
            loadFunc = aboutLoadFunc;
            pageTitle = "About";
            break;
        case 'live-report':
            url = 'templates/live-report-main.html';
            loadFunc = liveReportLoadFunc;
            pageTitle = "Live report";
            break;
        default:
            return;
    }
    AjaxGetRequestAsync(url)
        .then(data => {
            $("main").html(data);
            $("#page-title").html(pageTitle);
            setTimeout(() => {
                loadFunc();
            }, 1);
        });
}

// ==================================================== Home ========================================
function homeLoadFunc() {
    coinsLoad();
    $('#my-parallax').parally({ offset: -35 });
}

function addCurrencyToReportList(element) {
    const elementData = {
        id: element.dataset.id,
        symbol: element.dataset.symbol,
        name: element.dataset.name
    };
    getReportListAsync()
        .then(list => {
            if (element.checked) {
                if (list.length >= 5) {
                    let html = "";
                    list.forEach(item => {
                        html += `
                                    <tr>
                                        <td>
                                            <div class="custom-control custom-switch">
                                                <input type="checkbox" class="custom-control-input report-flag" id="cb-${item.id}-modal" data-id="${item.id}" checked>
                                                <label class="custom-control-label" for="cb-${item.id}-modal"></label>
                                            </div>
                                        </td>
                                        <td>
                                            <Label class="coin-symbol">${item.symbol.toUpperCase()}</Label>
                                            <Label class="coin-name">(id: ${item.id})</Label>
                                        </td>                                        
                                    </tr>
                                `;
                    });
                    $("#reportCurrencyListModal table").html(html);
                    $("#reportCurrencyListModal")[0].dataset.newId = elementData.id;
                    $("#reportCurrencyListModal")[0].dataset.newSymbol = elementData.symbol;
                    $("#reportCurrencyListModal")[0].dataset.newName = elementData.name;
                    $("#reportCurrencyListModal").modal("show");
                    element.checked = false;
                } else {
                    list.push(elementData);
                }
            } else {
                list = list.filter(x => x.id !== elementData.id)
            }
            setReportListAsync(list);
        })
        .catch(err => alert(err));
}

function onSaveCoinListReport() {
    const newData = {
        "id": $("#reportCurrencyListModal")[0].dataset.newId,
        "symbol": $("#reportCurrencyListModal")[0].dataset.newSymbol,
        "name": $("#reportCurrencyListModal")[0].dataset.newName
    }
    let itemsToRemove = [];
    $("#reportCurrencyListModal input").each(function() {
        if (!this.checked) {
            itemsToRemove.push(this.dataset.id);
        }
    });
    getReportListAsync()
        .then(list => {
            list = list.filter(x => !itemsToRemove.includes(x.id));
            if (list.length < 5) {
                list.push(newData);
                setReportListAsync(list);
                setReportItems();
            }
            $("#reportCurrencyListModal").modal("hide");
        })
        .catch(err => alert(err));
}

function setReportItems() {
    $(`.report-flag`).each(function() {
        this.checked = false;
    });
    getReportListAsync()
        .then(coinsList => {
            coinsList.forEach(item => {
                $(`#report-${item.id}.report-flag`).each(function() {
                    this.checked = true;
                });
            });
        })
        .catch(err => alert(err));
}

function Search() {
    coinsLoad($("#searchTxt")[0].value);
}

function coinsLoad(search) {
    const dataLimit = 300;
    $("#card-container").html("<div class='loader'></div>");
    AjaxGetRequestAsync("https://api.coingecko.com/api/v3/coins/list")
        .then(data => {
            if (search !== null && search !== undefined && search.trim() !== "")
                data = data.filter(x =>
                    x.symbol.toLowerCase() === search.toLowerCase());

            if (data.length > dataLimit)
                data = data.slice(0, dataLimit - 1);

            var html = "";
            for (const item of data) {
                html += `
                <div class="card" style="width: 18rem;">
                    <div class="card-body">
                        <div class="custom-control custom-switch right">
                            <input type="checkbox" class="custom-control-input report-flag" id="report-${item.id}" onchange="addCurrencyToReportList(this)"
                            data-id="${item.id}" data-name="${item.name}" data-symbol="${item.symbol}">
                            <label class="custom-control-label" for="report-${item.id}"></label>
                        </div>
                        <h5 class="card-title">${item.symbol}</h5>
                        <p class="card-text">${item.name}</p>
                        <button type="button" onclick="miShow('${item.id}')" class="btn btn-secondary" data-toggle="collapse" data-target="#mi-${item.id}-body">More info</button>
                        <div id="mi-${item.id}-body" class="collapse more-info-body"></div>
                    </div>
                </div>
            `;
            }
            $("#card-container").html(html);
            setReportItems();
        });
}

async function miShow(id) {
    if ($(`#mi-${id}`).is(":visible"))
        return;
    try {
        let moreInfoBody = $(`#mi-${id}-body`);
        moreInfoBody.html("<div class='loader'></div>");
        let mIData = await cookieMIReadAsync(id);
        if (mIData == null) {
            mIData = await getMoreInfoOnlineAsync(id);
            cookieMIWriteAsync(id, mIData);
        }
        if (mIData !== null) {
            moreInfoBody.html(`
            <img src="${mIData.img}" />
            <table>
                    <tr>
                        <td>USD:</td>
                        <td>${mIData.usd} $</td>
                    </tr>
                    <tr>
                        <td>EUR:</td>
                        <td>${mIData.eur} €</td>
                    </tr>
                    <tr>
                        <td>ILS:</td>
                        <td>${mIData.ils} ₪</td>
                    </tr>
                </table>
                `);
        }
    } catch (e) {
        console.error(e);
    }
}

async function getMoreInfoOnlineAsync(id) {
    let onlineData = await AjaxGetRequestAsync(`https://api.coingecko.com/api/v3/coins/${id}`);
    if (onlineData !== null) {
        return {
            img: onlineData.image.small,
            ils: onlineData.market_data.current_price.ils,
            usd: onlineData.market_data.current_price.usd,
            eur: onlineData.market_data.current_price.eur
        }
    }
    return null;
}

// ==================================================== Live report ========================================
function liveReportLoadFunc() {
    let list = "";
    options.data = [];
    getReportListAsync().then(data => {
        if (data.length > 0) {
            for (let i = 0; i < data.length; i++) {
                if (list !== "")
                    list += ",";
                list += data[i].symbol.toUpperCase();

                options.data.push({
                    type: "line",
                    showInLegend: true,
                    name: data[i].symbol.toUpperCase(),
                    markerType: "square",
                    xValueFormatString: "DD/MM/YYYY HH:mm:ss",
                    color: color[i],
                    suffix: "$",
                    dataPoints: []
                });
            }
            $(".live-report-content").html(`<div id="chartContainer" style="height: 370px; width: 100%;"></div>`);
            options.title.text = `${list} >> USD`;
            chartSampling();
        } else {
            $(".live-report-content").html(`<img id="report-image" src="assets/images/cat2.jpg" /> <div class="live-report-error">To see the live reports you must select at least one coin from home page.</div>`);
        }
    });

    function chartSampling() {
        if (!$(".live-report-content").is(":visible"))
            return;
        getLiveReportChartDataAsync(list)
            .then(data => {
                let now = new Date();
                options.data.forEach(item => {
                    item.dataPoints.push({
                        x: now,
                        y: data[item.name].USD
                    });
                })
                $("#chartContainer").CanvasJSChart(options);
                setTimeout(chartSampling, 2 * 1000);
            });
    }
}

const options = {
    animationEnabled: true,
    theme: "light2",
    title: {
        text: "Coins to USD"
    },
    axisX: {
        title: "Time",
        valueFormatString: "HH:mm:ss"
    },
    axisY: {
        title: "Coin Value",
        suffix: "$",
    },
    toolTip: {
        shared: true
    },
    legend: {
        cursor: "pointer",
        verticalAlign: "bottom",
        horizontalAlign: "left",
        dockInsidePlotArea: true,
        itemclick: dataSeriesToString
    },
    data: [{
        type: "line",
        showInLegend: true,
        name: "test",
        markerType: "square",
        xValueFormatString: "DD/MM/YYYY HH:mm:ss",
        color: "#F08080",
        yValueFormatString: "0.00$",
        dataPoints: [
            { x: new Date(2017, 10, 1, 3, 4), y: 63.345 },
            { x: new Date(2017, 10, 2, 5, 6), y: 69 },
        ]
    }]
};

const color = [generateRandomColor(), generateRandomColor(), generateRandomColor(), generateRandomColor(), generateRandomColor()]

function generateRandomColor() {
    var randomColor = Math.floor(Math.random() * 16777215).toString(16);
    return `#${randomColor}`;
}

function dataSeriesToString(e) {
    if (typeof(e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
        e.dataSeries.visible = false;
    } else {
        e.dataSeries.visible = true;
    }
    e.chart.render();
}

async function getLiveReportChartDataAsync(cryptoList) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            $.ajax({
                url: `https://min-api.cryptocompare.com/data/pricemulti?tsyms=USD&fsyms=${cryptoList}`,
                success: data => {
                    resolve(data);
                },
                error: function(xhr, status, error) {
                    if (xhr.responseJSON !== undefined) {
                        reject(`(${xhr.status}) ${xhr.responseJSON.error}`);
                    } else {
                        reject(`(${xhr.status}) ${xhr.statusText}`);
                    }
                }
            });
        }, 100);
    });
}

// ==================================================== About ========================================
function aboutLoadFunc() {
    console.log("about");
}