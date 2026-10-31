const channelNameSelector = 'yt-lockup-view-model .ytContentMetadataViewModelMetadataRow:first-child .ytContentMetadataViewModelMetadataText';
const channelData = new Map();

const getChannel = target => {
    const channelName = target.closest?.(channelNameSelector);
    if (!channelName || channelName.closest('a')) {
        return null;
    }
    const lockup = channelName.closest('yt-lockup-view-model');
    const avatar = lockup.querySelector('.ytLockupMetadataViewModelAvatar [role="button"]');
    if (!avatar) {
        return null;
    }
    const name = channelName.textContent.trim();
    // movies etc. put something else (e.g. "Animation 2007") in the first row
    const isCollab = avatar.matches('yt-avatar-stack-view-model');
    if (!isCollab && !avatar.getAttribute('aria-label')?.includes(name)) {
        return null;
    }
    return { lockup, avatar, name, isCollab };
};

// the page never has the channel URL - only the (hidden) avatar button knows it - so ask oEmbed by video id
const getChannelData = lockup => {
    const href = lockup.querySelector('a[href^="/watch"]')?.getAttribute('href');
    const videoId = href && new URL(href, location.origin).searchParams.get('v');
    if (!videoId) {
        return Promise.resolve(null);
    }
    if (!channelData.has(videoId)) {
        channelData.set(videoId, fetch(`/oembed?format=json&url=https://www.youtube.com/watch?v=${videoId}`)
            .then(response => response.ok ? response.json() : null)
            .catch(() => null));
    }
    return channelData.get(videoId);
};

const openInNewTab = async (channel, active) => {
    const data = await getChannelData(channel.lockup);
    // oEmbed only knows the uploader - not the other collab channels
    if (!data?.author_url || (channel.isCollab && data.author_name !== channel.name)) {
        return;
    }
    chrome.runtime.sendMessage({ url: data.author_url, active });
};

window.addEventListener('pointerover', event => {
    const channel = getChannel(event.target);
    if (channel) {
        getChannelData(channel.lockup);
    }
});

// stop middle-click autoscroll
window.addEventListener('mousedown', event => {
    if (event.button === 1 && getChannel(event.target)) {
        event.preventDefault();
    }
}, true);

window.addEventListener('click', event => {
    const channel = getChannel(event.target);
    if (!channel) {
        return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.ctrlKey || event.metaKey) {
        openInNewTab(channel, event.shiftKey);
    } else {
        channel.avatar.click();
    }
}, true);

window.addEventListener('auxclick', event => {
    if (event.button !== 1) {
        return;
    }
    const channel = getChannel(event.target);
    if (!channel) {
        return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    openInNewTab(channel, event.shiftKey);
}, true);
