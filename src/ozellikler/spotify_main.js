window.__geniusPlaybackSpeed = 1.0;
window.__geniusPreservePitch = true;
window.__geniusMediaElements = new Set();

const originalDescriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'playbackRate');

// Override playbackRate property
Object.defineProperty(HTMLMediaElement.prototype, 'playbackRate', {
    get() {
        return originalDescriptor.get.call(this);
    },
    set(value) {
        originalDescriptor.set.call(this, window.__geniusPlaybackSpeed);
    }
});

// Intercept play() to enforce speed before playing
const originalPlay = HTMLMediaElement.prototype.play;
HTMLMediaElement.prototype.play = function() {
    window.__geniusMediaElements.add(this);
    originalDescriptor.set.call(this, window.__geniusPlaybackSpeed);
    this.defaultPlaybackRate = window.__geniusPlaybackSpeed;
    this.preservesPitch = window.__geniusPreservePitch;
    return originalPlay.apply(this, arguments);
};

// Intercept document.createElement to catch video/audio elements early
const originalCreateElement = document.createElement;
document.createElement = function(tagName, options) {
    const element = originalCreateElement.call(this, tagName, options);
    if (tagName && (tagName.toLowerCase() === 'video' || tagName.toLowerCase() === 'audio')) {
        window.__geniusMediaElements.add(element);
        originalDescriptor.set.call(element, window.__geniusPlaybackSpeed);
    }
    return element;
};

// Listen for extension commands from the isolated world
window.addEventListener('genius-speed-change', (e) => {
    if (e.detail.speed !== undefined) window.__geniusPlaybackSpeed = e.detail.speed;
    if (e.detail.preservePitch !== undefined) window.__geniusPreservePitch = e.detail.preservePitch;
    
    // Apply to all elements we know about
    window.__geniusMediaElements.forEach(media => {
        try {
            originalDescriptor.set.call(media, window.__geniusPlaybackSpeed);
            media.defaultPlaybackRate = window.__geniusPlaybackSpeed;
            media.preservesPitch = window.__geniusPreservePitch;
        } catch (err) {}
    });
    
    // Also try DOM query as fallback
    document.querySelectorAll('video, audio').forEach(media => {
        try {
            window.__geniusMediaElements.add(media);
            originalDescriptor.set.call(media, window.__geniusPlaybackSpeed);
            media.defaultPlaybackRate = window.__geniusPlaybackSpeed;
            media.preservesPitch = window.__geniusPreservePitch;
        } catch (err) {}
    });
});
