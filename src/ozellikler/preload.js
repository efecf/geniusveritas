chrome.storage.local.get(['removeRedAnnotations'], (result) => {
  if (result.removeRedAnnotations) {
    document.documentElement.classList.add('gv-remove-red-annotations');
  }
});
