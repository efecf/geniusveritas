function injectAlbumButton() {
  const dropdownLists = document.querySelectorAll('[class*="StickyToolbarDropdown__DropdownItems"]');
  dropdownLists.forEach(list => {
    if (list.querySelector('.genius-copy-tr-item')) return;

    const buttons = Array.from(list.querySelectorAll('button'));
    const originalBtn = buttons.find(btn => btn.textContent.trim() === 'Copy Tracklist Markup');

    if (originalBtn) {
      const targetLi = originalBtn.closest('li');
      if (!targetLi) return;

      const newLi = document.createElement('li');
      newLi.className = targetLi.className;
      newLi.classList.add('genius-copy-tr-item');

      const newBtn = document.createElement('button');
      newBtn.className = originalBtn.className;
      newBtn.type = 'button';
      newBtn.textContent = 'Copy Tracklist Markup (TR)';

      newBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Trigger original copy
        originalBtn.click();

        // Modify clipboard content after a short delay
        setTimeout(async () => {
          try {
            const text = await navigator.clipboard.readText();
            if (text) {
              const newText = text.replace('Lyrics and Tracklist', 'Şarkı Sözleri ve Şarkı Listesi');
              await navigator.clipboard.writeText(newText);

              const oldText = newBtn.textContent;
              newBtn.textContent = 'Kopyalandı (TR)';
              const oldColor = newBtn.style.color;
              newBtn.style.color = '#10B981';
              setTimeout(() => {
                newBtn.textContent = oldText;
                newBtn.style.color = oldColor;
              }, 2000);
            }
          } catch (err) {
            console.warn('Clipboard access failed:', err);
          }
        }, 200);
      });

      newLi.appendChild(newBtn);
      targetLi.after(newLi);
    }
  });
}

const observer = new MutationObserver((mutations) => {
  let shouldCheck = false;
  for (let mutation of mutations) {
    if (mutation.addedNodes.length) {
      shouldCheck = true;
      break;
    }
  }
  if (shouldCheck) {
    injectAlbumButton();
  }
});
observer.observe(document.body, { childList: true, subtree: true });

setInterval(injectAlbumButton, 500);
setTimeout(injectAlbumButton, 1000);
