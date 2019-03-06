browser.runtime.onInstalled.addListener(async ({reason, temporary }) => {
    // for development use
    if(temporary) {
        return;
    };

    switch(reason) {
        case "install":
            // browser.runtime.openOptionsPage();
            const url = browser.runtime.getURL("https://github.com/dthigpen/todotxt-extension#todotxt-extension");
            await browser.tabs.create({ url, });
            break;
        case "update":
            break;
    }
});