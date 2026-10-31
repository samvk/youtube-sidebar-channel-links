chrome.runtime.onMessage.addListener(({ url, active }, sender) => {
    if (!sender.tab || !url.startsWith('https://www.youtube.com/')) {
        return;
    }
    chrome.tabs.create({ url, active, openerTabId: sender.tab.id, index: sender.tab.index + 1 });
});
