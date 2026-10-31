const channelNameSelector = 'yt-lockup-view-model .ytContentMetadataViewModelMetadataRow:first-child .ytContentMetadataViewModelMetadataText';

// the channel name has no link of its own - the only thing that knows the channel is the (hidden) avatar button, so click that
window.addEventListener('click', event => {
    const channelName = event.target.closest?.(channelNameSelector);
    if (!channelName || channelName.closest('a')) {
        return;
    }
    const avatar = channelName.closest('yt-lockup-view-model').querySelector('.ytLockupMetadataViewModelAvatar [role="button"]');
    if (!avatar) {
        return;
    }
    // movies etc. put something else (e.g. "Animation 2007") in the first row
    const isCollab = avatar.matches('yt-avatar-stack-view-model');
    if (!isCollab && !avatar.getAttribute('aria-label')?.includes(channelName.textContent.trim())) {
        return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    avatar.click();
}, true);
