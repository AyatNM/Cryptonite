function cookieMIReadAsync(id) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (document.cookie !== "") {
                const cookieArr = document.cookie.split(";");
                for (const item of cookieArr) {
                    const cookieObj = item.split("=");
                    if (cookieObj[0] === `mi_${id}`)
                        resolve(JSON.parse(cookieObj[1]));
                }
            }
            resolve(null);
        }, 100);
    });
}

function cookieMIWriteAsync(coinId, coinData) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const expireDate = new Date();
            expireDate.setMinutes(expireDate.getMinutes() + 2);
            document.cookie = `mi_${coinId}=${JSON.stringify(coinData)}; expires= ${expireDate.toUTCString()}`;
            resolve();
        }, 100);
    });
}

function getReportListAsync() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            let json = localStorage.getItem("my_report_list");
            if (json === null || json.trim() === "")
                resolve([]);
            else
                resolve(JSON.parse(json));
        }, 100);
    });
}

function setReportListAsync(list) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            let json = localStorage.setItem("my_report_list", JSON.stringify(list));
            resolve();
        }, 100);
    });
}