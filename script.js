const channelNameSelectors = {
    'ytd-watch-flexy yt-lockup-view-model': '.ytContentMetadataViewModelMetadataRow:first-child .ytContentMetadataViewModelMetadataText',
    '.ytp-modern-videowall-still': '.ytp-modern-videowall-still-info-author',
};
const linkClass = 'sidebar-channel-link';
const channelData = new Map();

const getVideoId = card => {
    const link = card.matches('a') ? card : card.querySelector('a[href^="/watch"]');
    return link ? new URL(link.href).searchParams.get('v') : null;
};

// the page never has the channel URL - only the (hidden) avatar button knows it - so ask oEmbed by video id
const getChannelData = videoId => {
    if (!channelData.has(videoId)) {
        channelData.set(videoId, fetch(`/oembed?format=json&url=https://www.youtube.com/watch?v=${videoId}`)
            .then(response => response.ok ? response.json() : null)
            .catch(() => null));
    }
    return channelData.get(videoId);
};

const unwrap = link => link.replaceWith(...link.childNodes);

const syncCard = async (card, channelNameSelector) => {
    const videoId = getVideoId(card) ?? '';
    // YouTube reuses these elements for other videos
    if (card.dataset.channelLinkVideoId !== videoId) {
        card.dataset.channelLinkVideoId = videoId;
        card.querySelectorAll(`.${linkClass}`).forEach(unwrap);
    }
    if (!videoId) {
        return;
    }
    const data = await getChannelData(videoId);
    if (card.dataset.channelLinkVideoId !== videoId) {
        return;
    }
    const url = data?.author_url && new URL(data.author_url).pathname;
    // matching on the name skips movies etc. (e.g. "Animation 2007") and the non-uploader collab channels
    for (const channelName of card.querySelectorAll(channelNameSelector)) {
        const link = channelName.querySelector(`.${linkClass}`);
        if (!url || channelName.textContent.trim() !== data.author_name.trim()) {
            link && unwrap(link);
        } else if (!link) {
            const newLink = document.createElement('a');
            newLink.className = linkClass;
            newLink.href = url;
            newLink.append(...channelName.childNodes);
            channelName.append(newLink);
        } else if (link.getAttribute('href') !== url) {
            link.href = url;
        }
    }
};

let syncScheduled = false;
new MutationObserver(() => {
    if (syncScheduled) {
        return;
    }
    syncScheduled = true;
    requestAnimationFrame(() => {
        syncScheduled = false;
        for (const [cardSelector, channelNameSelector] of Object.entries(channelNameSelectors)) {
            document.querySelectorAll(cardSelector).forEach(card => syncCard(card, channelNameSelector));
        }
    });
}).observe(document, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: [ 'href' ],
});

// keep the card from _also_ opening the video - and a plain click goes through the avatar so YouTube navigates without a full page load
window.addEventListener('click', event => {
    const link = event.target.closest?.(`.${linkClass}`);
    if (!link) {
        return;
    }
    event.stopImmediatePropagation();
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
        return;
    }
    const avatar = link.closest('yt-lockup-view-model')?.querySelector('.ytLockupMetadataViewModelAvatar yt-decorated-avatar-view-model [role="button"]');
    if (avatar) {
        event.preventDefault();
        avatar.click();
    }
}, true);

window.addEventListener('auxclick', event => {
    if (event.target.closest?.(`.${linkClass}`)) {
        event.stopImmediatePropagation();
    }
}, true);
