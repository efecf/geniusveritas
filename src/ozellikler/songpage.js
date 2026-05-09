// Helper function to safely trigger React input events safanin gotunusikm
function setNativeValue(element, value) {
  let nativeInputValueSetter = null;
  if (element.tagName === 'TEXTAREA') {
    nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
  } else if (element.tagName === 'INPUT') {
    nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
  }

  if (nativeInputValueSetter) {
    nativeInputValueSetter.call(element, value);
  } else {
    element.value = value;
  }
}

function toRoman(num) {
  const roman = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX"];
  return roman[num] || num.toString();
}

function fromRoman(str) {
  const roman = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX"];
  const index = roman.indexOf(str);
  return index > 0 ? index : (parseInt(str, 10) || 0);
}

function getSongDetails() {
  const titleElement = document.querySelector('[class*="SongHeader-desktop__HiddenMask"]');
  const title = titleElement ? titleElement.textContent.trim() : "";

  let ftText = "";

  // Look for the Featuring label in the bottom Credits section
  const creditLabels = document.querySelectorAll('[class*="Credit__Label"]');
  for (const label of creditLabels) {
    if (label.textContent.trim() === 'Featuring') {
      const container = label.closest('[class*="Credit__Container"]');
      if (container) {
        const contributor = container.querySelector('[class*="Credit__Contributor"]');
        if (contributor) {
          ftText = contributor.textContent.trim();
          break;
        }
      }
    }
  }

  // Fallback to Header credits if not found in bottom credits
  if (!ftText) {
    const headerContainers = document.querySelectorAll('[class*="HeaderCredit__Container"]');
    for (const container of headerContainers) {
      const label = container.querySelector('[class*="HeaderCredit__Label"]');
      if (label && label.textContent.trim() === 'Featuring') {
        const list = container.querySelector('[class*="SongHeader-desktop__CreditList"]');
        if (list) {
          ftText = list.textContent.trim();
        }
        break;
      }
    }
  }

  return { title, ftText };
}

function isNonMusic() {
  const tagElements = document.querySelectorAll('[class*="SongTags__Tag"]');
  for (const el of tagElements) {
    if (el.textContent.trim() === 'Non-Music') {
      return true;
    }
  }
  return false;
}

function wrapSelection(tag) {
  const textarea = document.querySelector('.LyricsEdit-desktop__Editor-sc-68d821bb-1 textarea, textarea[class*="LyricsTextareaInput"]');
  if (!textarea) return;

  const startPos = textarea.selectionStart !== undefined ? textarea.selectionStart : textarea.value.length;
  const endPos = textarea.selectionEnd !== undefined ? textarea.selectionEnd : textarea.value.length;

  const fullText = textarea.value;
  const selectedText = fullText.substring(startPos, endPos);

  const openTag = `<${tag}>`;
  const closeTag = `</${tag}>`;

  const textToInsert = `${openTag}${selectedText}${closeTag}`;

  const newValue = fullText.substring(0, startPos) + textToInsert + fullText.substring(endPos);
  setNativeValue(textarea, newValue);

  const newCursorPos = startPos === endPos ? startPos + openTag.length : startPos + textToInsert.length;
  textarea.selectionStart = newCursorPos;
  textarea.selectionEnd = newCursorPos;

  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  textarea.focus();
}

function wrapInParentheses(textarea) {
  if (!textarea) return;

  const startPos = textarea.selectionStart !== undefined ? textarea.selectionStart : textarea.value.length;
  const endPos = textarea.selectionEnd !== undefined ? textarea.selectionEnd : textarea.value.length;

  const fullText = textarea.value;
  let selectedText = fullText.substring(startPos, endPos);

  // Capitalize first letter
  if (selectedText.length > 0) {
    selectedText = selectedText.charAt(0).toUpperCase() + selectedText.slice(1);
  }

  const textToInsert = `(${selectedText})`;

  const newValue = fullText.substring(0, startPos) + textToInsert + fullText.substring(endPos);
  setNativeValue(textarea, newValue);

  const newCursorPos = startPos === endPos ? startPos + 1 : startPos + textToInsert.length;
  textarea.selectionStart = newCursorPos;
  textarea.selectionEnd = newCursorPos;

  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  textarea.focus();
}

function wrapTextInTextarea(textarea, openTag, closeTag = '') {
  if (!textarea) return;

  const startPos = textarea.selectionStart !== undefined ? textarea.selectionStart : textarea.value.length;
  const endPos = textarea.selectionEnd !== undefined ? textarea.selectionEnd : textarea.value.length;

  const fullText = textarea.value;
  const selectedText = fullText.substring(startPos, endPos);

  const textToInsert = `${openTag}${selectedText}${closeTag}`;

  const newValue = fullText.substring(0, startPos) + textToInsert + fullText.substring(endPos);
  setNativeValue(textarea, newValue);

  const newCursorPos = startPos === endPos ? startPos + openTag.length : startPos + textToInsert.length;
  textarea.selectionStart = newCursorPos;
  textarea.selectionEnd = newCursorPos;

  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  textarea.focus();
}

function insertText(baseText, itemLabel) {
  const textarea = document.querySelector('.LyricsEdit-desktop__Editor-sc-68d821bb-1 textarea, textarea[class*="LyricsTextareaInput"]');
  if (!textarea) return;

  let textToInsert = baseText;
  let fullText = textarea.value;
  let textWasModified = false;

  if (itemLabel === 'Header' || itemLabel === 'Translation') {
    const details = getSongDetails();
    let songPart = details.title ? `"${details.title}"` : '""';
    if (details.ftText) {
      songPart += ` ft. ${details.ftText}`;
    }

    if (itemLabel === 'Header') {
      textToInsert = `[${songPart} için şarkı sözleri]`;
    } else {
      textToInsert = `[${songPart} için Türkçe şarkı sözleri]`;
    }
  }

  const typeMap = {
    'Bölüm': 'Bölüm',
    'Verse': 'Verse',
    'Kısım': 'Kısım'
  };

  const startPos = textarea.selectionStart !== undefined ? textarea.selectionStart : fullText.length;
  const endPos = textarea.selectionEnd !== undefined ? textarea.selectionEnd : fullText.length;

  let leftPart = fullText.substring(0, startPos);
  let rightPart = fullText.substring(endPos);

  if (typeMap[itemLabel]) {
    const type = typeMap[itemLabel];
    if (type === 'Bölüm' || type === 'Verse') {
      const regex = new RegExp(`\\[${type}(?:\\s+(\\d+))?\\]`, 'g');
      let maxNum = 0;
      let hasUnnumbered = false;
      let match;
      while ((match = regex.exec(fullText)) !== null) {
        if (match[1]) {
          maxNum = Math.max(maxNum, parseInt(match[1], 10));
        } else {
          hasUnnumbered = true;
        }
      }

      if (maxNum === 0 && !hasUnnumbered) {
        textToInsert = `[${type}]`;
      } else {
        if (hasUnnumbered) {
          leftPart = leftPart.replace(new RegExp(`\\[${type}\\]`, 'g'), `[${type} 1]`);
          rightPart = rightPart.replace(new RegExp(`\\[${type}\\]`, 'g'), `[${type} 1]`);
          textWasModified = true;
          if (maxNum === 0) maxNum = 1;
        }
        textToInsert = `[${type} ${maxNum + 1}]`;
      }
    } else if (type === 'Kısım') {
      const regex = /(?:<b>)?\[Kısım(?:\s+([IVXLCDM]+))?\](?:<\/b>)?/g;
      let maxNum = 0;
      let hasUnnumbered = false;
      let match;
      while ((match = regex.exec(fullText)) !== null) {
        if (match[1]) {
          maxNum = Math.max(maxNum, fromRoman(match[1]));
        } else {
          hasUnnumbered = true;
        }
      }

      if (maxNum === 0 && !hasUnnumbered) {
        textToInsert = `<b>[Kısım I]</b>`;
      } else {
        if (hasUnnumbered) {
          leftPart = leftPart.replace(/(?:<b>)?\[Kısım\](?:<\/b>)?/g, `<b>[Kısım I]</b>`);
          rightPart = rightPart.replace(/(?:<b>)?\[Kısım\](?:<\/b>)?/g, `<b>[Kısım I]</b>`);
          textWasModified = true;
          if (maxNum === 0) maxNum = 1;
        }
        textToInsert = `<b>[Kısım ${toRoman(maxNum + 1)}]</b>`;
      }
    }
  }

  let newValue = leftPart + textToInsert + rightPart;
  setNativeValue(textarea, newValue);

  let newCursorPos = leftPart.length + textToInsert.length;

  if (!textWasModified) {
    if ((itemLabel === 'Header' || itemLabel === 'Translation') && textToInsert.includes('[""')) {
      newCursorPos = leftPart.length + 2;
    } else if (textToInsert === '[]') {
      newCursorPos = leftPart.length + 1;
    } else if (textToInsert === '<h1></h1>') {
      newCursorPos = leftPart.length + 4;
    }
  }

  textarea.selectionStart = newCursorPos;
  textarea.selectionEnd = newCursorPos;

  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  textarea.focus();
}

function updateVisibility() {
  const toolbar = document.querySelector('.genius-custom-toolbar');
  if (!toolbar) return;

  const editor = document.querySelector('.LyricsEdit-desktop__Editor-sc-68d821bb-1 textarea, textarea[class*="LyricsTextareaInput"]');
  // Check if editor exists and is actually visible (offsetHeight > 0 prevents it from showing if the form is hidden via CSS)
  const editorExistsAndVisible = editor && editor.offsetHeight > 0;

  toolbar.style.display = editorExistsAndVisible ? 'inline-flex' : 'none';
}

function injectButton(toolbarElement) {
  if (toolbarElement.querySelector('.genius-custom-toolbar')) return;

  const toolbarWrapper = document.createElement('div');
  toolbarWrapper.className = 'genius-custom-toolbar';
  toolbarWrapper.style.display = 'none'; // Controlled by updateVisibility

  // 1. Semboller Dropdown
  const symbolsContainer = document.createElement('div');
  symbolsContainer.className = 'genius-custom-dropdown-container';
  symbolsContainer.innerHTML = `
    <span class="Dropdown__Toggle-sc-7ecff405-2 dcjJnV">
      <button type="button" class="SmallButton__Container-sc-52e3e09f-0 eAerHv StickyToolbar__SmallButton-sc-e2eab97b-5 gGMYBx" title="Semboller">
        <span>Semboller</span>
        <span class="StickyToolbar__SmallButtonIcon-sc-e2eab97b-3 danWJg">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 7"><path d="M4.488 7 0 0h8.977L4.488 7Z"></path></svg>
        </span>
      </button>
    </span>
  `;
  const symbolsMenu = document.createElement('div');
  symbolsMenu.className = 'genius-custom-dropdown-menu';
  symbolsMenu.style.minWidth = '120px';
  const symbolsItems = [
    { label: 'Emdash (—)', text: '—' },
    { label: 'ZWSP', text: '\u200B' },
    { label: 'Â', text: 'Â' },
    { label: 'â', text: 'â' }
  ];
  symbolsItems.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'genius-custom-dropdown-item';
    btn.textContent = item.label;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      navigator.clipboard.writeText(item.text).then(() => {
        const originalText = item.label;
        btn.textContent = 'Kopyalandı';
        btn.style.color = '#10B981';
        btn.style.fontWeight = 'bold';

        setTimeout(() => {
          btn.textContent = originalText;
          btn.style.color = '';
          btn.style.fontWeight = '';
        }, 3000);
      });
    }, true);
    btn.addEventListener('mousedown', (e) => e.stopPropagation(), true);
    symbolsMenu.appendChild(btn);
  });
  symbolsContainer.appendChild(symbolsMenu);

  const symbolsToggle = symbolsContainer.querySelector('button');
  symbolsToggle.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    symbolsMenu.classList.toggle('show');
    // Hide other menu if open
    const headersMenu = toolbarWrapper.querySelector('.dropdown-headers .genius-custom-dropdown-menu');
    if (headersMenu) headersMenu.classList.remove('show');
  }, true);
  symbolsToggle.addEventListener('mousedown', (e) => e.stopPropagation(), true);

  // 2. Bold Button
  const boldBtnContainer = document.createElement('span');
  boldBtnContainer.className = 'Dropdown__Toggle-sc-7ecff405-2 dcjJnV';
  boldBtnContainer.innerHTML = `
    <button type="button" class="SmallButton__Container-sc-52e3e09f-0 eAerHv StickyToolbar__SmallButton-sc-e2eab97b-5 gGMYBx" style="width: 32px; min-width: 32px; padding: 0; display: flex; justify-content: center; align-items: center;" title="Bold">
      <span style="font-weight: bold; font-size: 14px;">B</span>
    </button>
  `;
  const boldBtn = boldBtnContainer.querySelector('button');
  boldBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    wrapSelection('b');
  }, true);
  boldBtn.addEventListener('mousedown', (e) => e.stopPropagation(), true);

  // 3. Parenthesis Button
  const parenBtnContainer = document.createElement('span');
  parenBtnContainer.className = 'Dropdown__Toggle-sc-7ecff405-2 dcjJnV';
  parenBtnContainer.innerHTML = `
    <button type="button" class="SmallButton__Container-sc-52e3e09f-0 eAerHv StickyToolbar__SmallButton-sc-e2eab97b-5 gGMYBx" style="width: 32px; min-width: 32px; padding: 0; display: flex; justify-content: center; align-items: center;" title="Parantez">
      <span style="font-weight: bold; font-size: 14px;">()</span>
    </button>
  `;
  const parenBtn = parenBtnContainer.querySelector('button');
  parenBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const textarea = document.querySelector('.LyricsEdit-desktop__Editor-sc-68d821bb-1 textarea, textarea[class*="LyricsTextareaInput"]');
    wrapInParentheses(textarea);
  }, true);
  parenBtn.addEventListener('mousedown', (e) => e.stopPropagation(), true);

  // 4. Italic Button
  const italicBtnContainer = document.createElement('span');
  italicBtnContainer.className = 'Dropdown__Toggle-sc-7ecff405-2 dcjJnV';
  italicBtnContainer.innerHTML = `
    <button type="button" class="SmallButton__Container-sc-52e3e09f-0 eAerHv StickyToolbar__SmallButton-sc-e2eab97b-5 gGMYBx" style="width: 32px; min-width: 32px; padding: 0; display: flex; justify-content: center; align-items: center;" title="Italic">
      <span style="font-style: italic; font-family: serif; font-size: 14px;">I</span>
    </button>
  `;
  const italicBtn = italicBtnContainer.querySelector('button');
  italicBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    wrapSelection('i');
  }, true);
  italicBtn.addEventListener('mousedown', (e) => e.stopPropagation(), true);

  // 4. Başlıklar Dropdown
  const headersContainer = document.createElement('div');
  headersContainer.className = 'genius-custom-dropdown-container dropdown-headers';
  headersContainer.innerHTML = `
    <span class="Dropdown__Toggle-sc-7ecff405-2 dcjJnV">
      <button type="button" class="SmallButton__Container-sc-52e3e09f-0 eAerHv StickyToolbar__SmallButton-sc-e2eab97b-5 gGMYBx" title="Başlıklar">
        <span>Başlıklar</span>
        <span class="StickyToolbar__SmallButtonIcon-sc-e2eab97b-3 danWJg">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 7"><path d="M4.488 7 0 0h8.977L4.488 7Z"></path></svg>
        </span>
      </button>
    </span>
  `;
  const headersMenu = document.createElement('div');
  headersMenu.className = 'genius-custom-dropdown-menu';
  headersMenu.style.minWidth = '180px';
  headersMenu.style.maxHeight = '400px';
  headersMenu.style.overflowY = 'auto';

  const details = getSongDetails();
  let songPart = details.title ? `"${details.title}"` : '""';
  if (details.ftText) {
    songPart += ` ft. ${details.ftText}`;
  }

  const headerText = `[${songPart} için şarkı sözleri]`;
  const translationText = `[${songPart} için Türkçe şarkı sözleri]`;

  let menuItems;
  if (isNonMusic()) {
    menuItems = [
      { label: 'Header 1', text: '<h1></h1>' },
      { label: 'Horizontal Line', text: '<hr>' }
    ];
  } else {
    menuItems = [
      { label: 'Header', text: headerText },
      { label: 'Translation', text: translationText },
      { label: 'Instrumental', text: '[Instrumental]' },
      { label: 'Snippet', text: '<b>[Kesit şarkı sözleri, resmî sözler yayımlanınca güncellenecektir]</b>' },
      { label: 'Giriş', text: '[Giriş]' },
      { label: 'Çıkış', text: '[Çıkış]' },
      { label: 'Kesit', text: '[Kesit]' },
      { label: 'Kısım', text: '<b>[Kısım I]</b>' },
      { label: 'Bölüm', text: '[Bölüm]' },
      { label: 'Verse', text: '[Verse]' },
      { label: 'Ön Nakarat', text: '[Ön Nakarat]' },
      { label: 'Nakarat', text: '[Nakarat]' },
      { label: 'Arka Nakarat', text: '[Arka Nakarat]' },
      { label: 'Köprü', text: '[Köprü]' },
      { label: 'Ara', text: '[Ara]' },
      { label: 'Enst. Ara', text: '[Enstrümantal Ara]' },
      { label: 'Enst. Çıkış', text: '[Enstrümantal Çıkış]' }
    ];
  }

  menuItems.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'genius-custom-dropdown-item';
    btn.textContent = item.label;
    btn.title = item.text;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      headersMenu.classList.remove('show');
      insertText(item.text, item.label);
    }, true);

    btn.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    }, true);

    headersMenu.appendChild(btn);
  });

  headersContainer.appendChild(headersMenu);

  const headersToggle = headersContainer.querySelector('button');
  headersToggle.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    headersMenu.classList.toggle('show');
    // Hide symbols menu if open
    symbolsMenu.classList.remove('show');
  }, true);

  headersToggle.addEventListener('mousedown', (e) => {
    e.stopPropagation();
  }, true);

  // Close menus when clicking outside
  document.addEventListener('click', (e) => {
    if (!symbolsContainer.contains(e.target)) {
      symbolsMenu.classList.remove('show');
    }
    if (!headersContainer.contains(e.target)) {
      headersMenu.classList.remove('show');
    }
  }, true);

  // Append all to wrapper in the requested order: [I] [B] [()] [Başlıklar] [Semboller]
  toolbarWrapper.appendChild(italicBtnContainer);
  toolbarWrapper.appendChild(boldBtnContainer);
  toolbarWrapper.appendChild(parenBtnContainer);
  toolbarWrapper.appendChild(headersContainer);
  toolbarWrapper.appendChild(symbolsContainer);

  toolbarElement.appendChild(toolbarWrapper);

  updateVisibility();
}

function renderGeniusMarkdown(text) {
  if (!text) return '<i>(Boş)</i>';

  let html = text;

  // 0. Markdown Blockquote
  html = html.replace(/(?:^|\n)>[ \t]*([^\n]*(\n(?!\s*\n)[^\n]*)*)/g, function (match, p1) {
    let cleanText = p1.replace(/\n>[ \t]*/g, '\n');
    cleanText = cleanText.replace(/\n/g, '<br>');
    return '<blockquote><p>' + cleanText + '</p></blockquote>';
  });

  // 1. YouTube Link
  html = html.replace(/(?:^|\s|<p>|<br>)(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[^\s<]*)/gi,
    '<div class="embedly_preview embedly_preview--video"><iframe width="100%" style="aspect-ratio: 16/9;" src="https://www.youtube-nocookie.com/embed/$1?modestbranding=1&showinfo=0&enablejsapi=1" frameborder="0" allowfullscreen="1"></iframe></div>'
  );

  // 2. Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

  // 3. Italic
  html = html.replace(/\*(.*?)\*/g, '<i>$1</i>');
  html = html.replace(/_(.*?)_/g, '<i>$1</i>');

  // 4. Link
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s]+)\)/g, '<a href="$2" target="_blank">$1</a>');

  // 5. Paragraph wrapping
  const blocks = html.split(/\n\s*\n/);
  const pBlocks = blocks.map(block => {
    let trimmed = block.trim();
    if (trimmed.startsWith('<blockquote') || trimmed.startsWith('<div') || trimmed.startsWith('<table') || trimmed.startsWith('<hr>')) {
      return block.replace(/\n/g, '<br>');
    }
    return '<p>' + block.replace(/\n/g, '<br>') + '</p>';
  });
  html = pBlocks.join('\n');
  // Clean up excessive <br>
  const blockTags = 'p|div|blockquote|center|h[1-6]|hr|ul|li|table';
  html = html.replace(new RegExp(`(?:<br>\\s*)+<(${blockTags})>`, 'gi'), '<$1>');
  html = html.replace(new RegExp(`(?:<br>\\s*)+<\\/(${blockTags})>`, 'gi'), '</$1>');
  html = html.replace(new RegExp(`<(${blockTags})>(?:\\s*<br>)+`, 'gi'), '<$1>');
  html = html.replace(new RegExp(`<\\/(${blockTags})>(?:\\s*<br>)+`, 'gi'), '</$1>');

  return html;
}

function injectPreviewButton(toolbar) {
  if (toolbar.dataset.geniusInjected === 'true') return;

  // Check if a preview container already exists in this field to avoid duplicates
  if (toolbar.parentElement && toolbar.parentElement.querySelector('.genius-preview-btn-container')) {
    toolbar.dataset.geniusInjected = 'true';
    return;
  }

  // If there are multiple toolbars, prioritize the InlineToolbar (which usually has "Add image")
  const isHelpers = toolbar.className.includes('TextEditorHelpers__Toolbar');
  const hasInlineSibling = toolbar.parentElement && toolbar.parentElement.querySelector('[class*="TextEditor__InlineToolbar"]');
  if (isHelpers && hasInlineSibling) {
    return; // Wait for the InlineToolbar to handle it
  }

  toolbar.dataset.geniusInjected = 'true';

  const btnContainer = document.createElement('div');
  btnContainer.className = 'genius-preview-btn-container';
  btnContainer.style.cssText = 'display:inline-flex; align-items:center; gap:8px; margin-left:8px; flex:1;';

  const findLocalTextarea = () => {
    let current = toolbar.parentElement;
    let textarea = null;
    let depth = 0;
    while (current && depth < 5) {
      const textareas = current.querySelectorAll('textarea');
      if (textareas.length > 0) {
        textarea = textareas[0];
        break;
      }
      current = current.parentElement;
      depth++;
    }
    return textarea;
  };

  // --- İtalik Butonu ---
  const italicBtn = document.createElement('button');
  italicBtn.className = 'genius-preview-btn SmallButton__Container-sc-52e3e09f-0 eAerHv';
  italicBtn.innerHTML = '<span style="font-style: italic; font-family: serif; font-size: 14px;">I</span>';
  italicBtn.title = "İtalik (*metin*)";
  italicBtn.style.padding = '0.25rem 0.5rem';
  italicBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const textarea = findLocalTextarea();
    if (textarea) {
      wrapTextInTextarea(textarea, '*', '*');
    }
  }, true);

  // --- Markdown Dropdown ---
  const markdownContainer = document.createElement('div');
  markdownContainer.className = 'genius-custom-dropdown-container';

  const markdownToggle = document.createElement('button');
  markdownToggle.className = 'genius-preview-btn SmallButton__Container-sc-52e3e09f-0 eAerHv';
  markdownToggle.innerHTML = 'Markdown <span style="margin-left:4px; font-size:10px;">▼</span>';
  markdownToggle.title = "Markdown Ekle";

  const markdownMenu = document.createElement('div');
  markdownMenu.className = 'genius-custom-dropdown-menu';
  markdownMenu.style.minWidth = '160px';
  markdownMenu.style.left = '0';
  markdownMenu.style.top = '100%';

  const markdownItems = [
    { label: '<hr>', open: '<hr>', close: '' },
    { label: '<small>', open: '<small>', close: '</small>' },
    { label: '<center>', open: '<center>', close: '</center>' },
    { label: '<small> & <center>', open: '<small><center>', close: '</center></small>' },
    { label: 'Görsel tablosu', open: '<table>\n<tbody>\n<tr>\n<td><img src="LİNK"></td>\n<td><img src="LİNK"></td>\n<td><img src="LİNK"></td>\n</tr>\n</tbody>\n</table>\n', close: '' }
  ];

  markdownItems.forEach(item => {
    const dBtn = document.createElement('button');
    dBtn.className = 'genius-custom-dropdown-item';
    dBtn.textContent = item.label;
    dBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      markdownMenu.classList.remove('show');
      const textarea = findLocalTextarea();
      if (textarea) {
        wrapTextInTextarea(textarea, item.open, item.close);
      }
    }, true);
    dBtn.addEventListener('mousedown', (e) => e.stopPropagation(), true);
    markdownMenu.appendChild(dBtn);
  });

  markdownContainer.appendChild(markdownToggle);
  markdownContainer.appendChild(markdownMenu);

  markdownToggle.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    markdownMenu.classList.toggle('show');
  }, true);
  markdownToggle.addEventListener('mousedown', (e) => e.stopPropagation(), true);

  const eyeIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;display:block;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
  const editIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;display:block;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>';

  // --- Önizleme Butonu ---
  const btn = document.createElement('button');
  btn.className = 'genius-preview-btn SmallButton__Container-sc-52e3e09f-0 eAerHv';
  btn.innerHTML = eyeIcon;
  btn.title = "Ön izlemeyi Aç/Kapat";
  btn.style.padding = '0.25rem 0.5rem';
  btn.style.marginLeft = 'auto';

  btnContainer.appendChild(btn);
  btnContainer.appendChild(italicBtn);
  btnContainer.appendChild(markdownContainer);

  // İçine ekle (Add image butonunun sağına)
  toolbar.style.display = 'flex';
  toolbar.style.alignItems = 'center';
  toolbar.appendChild(btnContainer);

  let previewDiv = null;

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const textarea = findLocalTextarea();
    if (!textarea) return;

    if (btn.classList.contains('active-preview')) {
      // Düzenle moduna dön
      btn.classList.remove('active-preview');
      btn.innerHTML = eyeIcon;

      italicBtn.disabled = false;
      italicBtn.style.opacity = '1';
      italicBtn.style.cursor = '';
      markdownToggle.disabled = false;
      markdownToggle.style.opacity = '1';
      markdownToggle.style.cursor = '';

      if (previewDiv) {
        previewDiv.style.display = 'none';
      }
      textarea.style.display = '';
    } else {
      // Ön izleme moduna geç
      btn.classList.add('active-preview');
      btn.innerHTML = editIcon;

      italicBtn.disabled = true;
      italicBtn.style.opacity = '0.5';
      italicBtn.style.cursor = 'not-allowed';
      markdownToggle.disabled = true;
      markdownToggle.style.opacity = '0.5';
      markdownToggle.style.cursor = 'not-allowed';

      if (!previewDiv) {
        previewDiv = document.createElement('div');
        previewDiv.className = 'genius-markdown-preview RichText__Container-sc-e8f13224-0 bLBXID';

        const computedStyle = window.getComputedStyle(textarea);
        previewDiv.style.width = '100%';
        previewDiv.style.minHeight = computedStyle.height !== 'auto' && computedStyle.height !== '0px' ? computedStyle.height : '150px';
        previewDiv.style.padding = computedStyle.padding || '10px';
        previewDiv.style.backgroundColor = computedStyle.backgroundColor || '#fafafa';
        previewDiv.style.border = computedStyle.border || '1px solid #e5e5e5';
        previewDiv.style.borderRadius = computedStyle.borderRadius;
        previewDiv.style.overflowY = 'auto';
        previewDiv.style.wordBreak = 'break-word';
        previewDiv.style.boxSizing = 'border-box';

        textarea.parentNode.insertBefore(previewDiv, textarea.nextSibling);
      }

      previewDiv.innerHTML = renderGeniusMarkdown(textarea.value);
      previewDiv.style.display = 'block';
      textarea.style.display = 'none';
    }
  }, true);
}

function injectQAButton(header) {
  if (header.querySelector('.genius-qa-dropdown-container')) return;

  const container = document.createElement('div');
  container.className = 'genius-custom-dropdown-container genius-qa-dropdown-container';
  container.style.marginLeft = 'auto';
  container.style.display = 'inline-flex';
  container.style.alignItems = 'center';

  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.className = 'TextButton-sc-9cf3fb52-0 cSusCd';
  toggleBtn.style.textDecoration = 'underline';
  toggleBtn.style.fontFamily = 'inherit';
  toggleBtn.style.fontSize = 'inherit';
  toggleBtn.style.background = 'none';
  toggleBtn.style.border = 'none';
  toggleBtn.style.cursor = 'pointer';
  toggleBtn.style.padding = '0';
  toggleBtn.textContent = 'Soru & Cevap';

  const menu = document.createElement('div');
  menu.className = 'genius-custom-dropdown-menu';
  menu.style.minWidth = '250px';
  menu.style.right = '0';
  menu.style.left = 'auto';

  const qaItems = [
    {
      label: 'Alternatif Kapak Tasarımı',
      q: 'Alternatif Kapak Tasarımı',
      a: '*URL*'
    },
    {
      label: 'Alternatif Parça İsmi',
      q: 'Alternatif Parça İsmi',
      a: '- ["*Başlık*"](*URL*)'
    },
    {
      label: 'Enstrümantal',
      q: 'Enstrümantal',
      a: '*URL*'
    },
    {
      label: 'Müzik videosundaki oyuncular kimler?',
      q: 'Müzik videosundaki oyuncular kimler?',
      a: '- *ISIM*\n- *ISIM*'
    },
    {
      label: 'Parça Spotify çalma listelerinde nasıl bir başarı gösterdi?',
      q: 'Parça Spotify çalma listelerinde nasıl bir başarı gösterdi?',
      a: 'Parça yayımlandığı gün *ISIM*, Spotify Türkiye\'nin popüler çalma listelerinden biri olan ["*Başlık*"](*URL*) listesine *x.* sıradan giriş yaparak çalma listesinin kapağı oldu.'
    },
    {
      label: 'Resmî olarak parçayı nereden dinleyebilirim?',
      q: 'Resmî olarak parçayı nereden dinleyebilirim?',
      a: '*URL*'
    }
  ];

  qaItems.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'genius-custom-dropdown-item';
    btn.textContent = item.label;
    btn.title = item.q;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      menu.classList.remove('show');

      const qTextarea = document.querySelector('textarea[name="question.body"]');
      if (qTextarea) {
        setNativeValue(qTextarea, item.q);
        qTextarea.dispatchEvent(new Event('input', { bubbles: true }));
      }

      const aSpan = document.querySelector('div[name="answer.body.markdown"] span[contenteditable]');
      if (aSpan) {
        aSpan.focus();
        document.execCommand('selectAll', false, null);
        document.execCommand('insertText', false, item.a);
      }
    }, true);
    btn.addEventListener('mousedown', (e) => e.stopPropagation(), true);
    menu.appendChild(btn);
  });

  container.appendChild(toggleBtn);
  container.appendChild(menu);

  toggleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    menu.classList.toggle('show');
  }, true);
  toggleBtn.addEventListener('mousedown', (e) => e.stopPropagation(), true);

  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) {
      menu.classList.remove('show');
    }
  }, true);

  const checkboxes = header.querySelector('[class*="AnswerForm__Checkboxes"]');
  if (checkboxes) {
    header.insertBefore(container, checkboxes);
    container.style.marginRight = '15px';
  } else {
    header.appendChild(container);
  }
}

function injectCoverArtChecker(pyongWrapper) {
  if (pyongWrapper.querySelector('.genius-cover-checker')) return;

  const svgCheck = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width:1rem;height:1rem;display:block"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  const svgCross = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width:1rem;height:1rem;display:block"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
  const svgDots = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width:1rem;height:1rem;display:block"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>`;

  const container = document.createElement('div');
  container.className = 'genius-cover-checker';
  container.style.cssText = [
    'display: flex',
    'align-items: center',
    'justify-content: center',
    'margin-top: 0.4rem',
    'cursor: default',
    'color: #fff',
    'height: 1.313rem',
    'overflow: visible',
    'position: relative'
  ].join(';');

  // Icon — never moves
  const iconSpan = document.createElement('span');
  iconSpan.style.cssText = 'display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0;';
  iconSpan.innerHTML = svgDots;

  // Genius-style tooltip box (like Radix Popover, data-side="bottom")
  const tooltipBox = document.createElement('div');
  tooltipBox.style.cssText = [
    'position: absolute',
    'top: calc(100% + 8px)',
    'left: 50%',
    'transform: translateX(-50%)',
    'background: #fff',
    'color: #000',
    'font-size: 0.8125rem',
    'font-family: Programme, "Programme Pan", Arial, sans-serif',
    'font-weight: 400',
    'line-height: 1.4',
    'padding: 8px 12px',
    'border-radius: 4px',
    'white-space: pre',
    'text-align: center',
    'pointer-events: none',
    'opacity: 0',
    'transition: opacity 0.15s ease',
    'z-index: 9999',
    'box-shadow: 0 2px 8px rgba(0,0,0,0.18)'
  ].join(';');

  // Upward arrow (like Genius's TooltipArrow)
  const arrow = document.createElement('span');
  arrow.style.cssText = [
    'position: absolute',
    'top: -5px',
    'left: 50%',
    'transform: translateX(-50%)',
    'width: 0',
    'height: 0',
    'border-left: 6px solid transparent',
    'border-right: 6px solid transparent',
    'border-bottom: 6px solid #fff'
  ].join(';');
  tooltipBox.appendChild(arrow);
  tooltipBox.appendChild(document.createTextNode('Kontrol ediliyor...'));

  container.appendChild(iconSpan);
  container.appendChild(tooltipBox);

  container.addEventListener('mouseenter', () => {
    tooltipBox.style.opacity = '1';
  });
  container.addEventListener('mouseleave', () => {
    tooltipBox.style.opacity = '0';
  });

  function getHeaderColors() {
    const header = document.querySelector('[class*="SongHeader-desktop__Container"]');
    if (!header) return "";
    const style = window.getComputedStyle(header);
    const bgImage = style.backgroundImage;
    if (!bgImage || !bgImage.includes('linear-gradient')) return "";

    const colorRegex = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/g;
    const matches = [...bgImage.matchAll(colorRegex)];
    if (matches.length < 2) return "";

    const toHex = (r, g, b) => {
      return "#" + [r, g, b].map(x => {
        const hex = parseInt(x).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      }).join("").toUpperCase();
    };

    const color1 = toHex(matches[0][1], matches[0][2], matches[0][3]);
    const color2 = toHex(matches[1][1], matches[1][2], matches[1][3]);

    return `\n${color1} | ${color2}`;
  }

  function setTooltip(text) {
    const colors = getHeaderColors();
    // Keep arrow as first child, update text node
    while (tooltipBox.childNodes.length > 1) tooltipBox.removeChild(tooltipBox.lastChild);
    tooltipBox.appendChild(document.createTextNode(text + colors));
  }

  function checkCover() {
    const img = document.querySelector('[class*="SongHeader-desktop__CoverArt"] img');
    if (!img || !img.src) {
      iconSpan.innerHTML = svgDots;
      setTooltip('Kapak bulunamadı');
      return;
    }

    const src = img.src;

    // Try to extract the original high-res URL from the Genius proxy URL
    let originalSrc = src;
    const m = src.match(/unsafe\/[^/]+\/(https?.+)/);
    if (m) {
      try { originalSrc = decodeURIComponent(m[1]); } catch (e) { }
    }

    // Detect format from original URL
    let format = 'Bilinmiyor';
    const lowerOrig = originalSrc.toLowerCase();
    if (lowerOrig.includes('.png')) format = 'PNG';
    else if (lowerOrig.includes('.jpg') || lowerOrig.includes('.jpeg')) format = 'JPG';
    else if (lowerOrig.includes('.webp')) format = 'WebP';
    else if (lowerOrig.includes('.gif')) format = 'GIF';

    const tempImg = new Image();
    tempImg.crossOrigin = 'anonymous';

    tempImg.onload = function () {
      const w = tempImg.naturalWidth;
      const h = tempImg.naturalHeight;
      const ok = (w === 1000 && h === 1000 && format === 'PNG');
      iconSpan.innerHTML = ok ? svgCheck : svgCross;
      setTooltip(`${w}x${h} · ${format}`);
    };

    tempImg.onerror = function () {
      const domW = img.naturalWidth;
      const domH = img.naturalHeight;
      if (domW > 0) {
        const ok = (domW === 1000 && domH === 1000 && format === 'PNG');
        iconSpan.innerHTML = ok ? svgCheck : svgCross;
        setTooltip(`${domW}x${domH} · ${format}`);
      } else {
        iconSpan.innerHTML = svgDots;
        setTooltip(`${format} · boyut alınamadı`);
      }
    };

    tempImg.src = originalSrc;
  }

  pyongWrapper.appendChild(container);
  checkCover();
}

function injectMetadataTagsDropdown() {
  // Find the Tags field inside the Edit Metadata dialog
  const tagsLabels = document.querySelectorAll('span.Field-shared__FieldLabel-sc-e2be1e24-2');
  let tagsFieldContainer = null;

  for (const label of tagsLabels) {
    // Match "Tags" label (content is "Tags\u00a0" with &nbsp;)
    if (label.textContent.trim() === 'Tags') {
      tagsFieldContainer = label.closest('label.Field-shared__FieldContainer-sc-e2be1e24-0');
      break;
    }
  }

  if (!tagsFieldContainer) return;
  if (tagsFieldContainer.querySelector('.genius-metadata-tags-dropdown')) return;

  // Find the TagInput combobox inside this field
  const tagInputContainer = tagsFieldContainer.querySelector('div[role="combobox"]');
  if (!tagInputContainer) return;

  // Create dropdown container
  const dropdownContainer = document.createElement('div');
  dropdownContainer.className = 'genius-custom-dropdown-container genius-metadata-tags-dropdown';
  dropdownContainer.style.cssText = 'position:absolute; top:0; right:0; z-index:10;';

  // Make the field container position:relative so our absolute positioning works
  const fieldControlDiv = tagsFieldContainer.querySelector('.Field-shared__FieldControlWithLabel-sc-e2be1e24-1');
  if (fieldControlDiv) {
    fieldControlDiv.style.position = 'relative';
  }

  // Toggle button
  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.className = 'genius-metadata-tags-toggle';
  toggleBtn.title = 'Hızlı Etiket Ekle';
  toggleBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;display:block;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;

  // Dropdown menu
  const menu = document.createElement('div');
  menu.className = 'genius-custom-dropdown-menu genius-metadata-tags-menu';
  menu.style.cssText = 'min-width:160px; right:0; left:auto;';

  const tagOptions = [
    { label: 'Türkçe', value: 'Türkçe' },
    { label: 'Türkiye', value: 'Türkiye' }
  ];

  tagOptions.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'genius-custom-dropdown-item';
    btn.textContent = opt.label;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      menu.classList.remove('show');

      // Find the text input inside the Tags combobox
      const reactSelectInput = tagInputContainer.querySelector('input[type="text"]');
      if (!reactSelectInput) return;

      reactSelectInput.focus();

      // Simulate typing each character individually so React Select processes them
      const chars = opt.value.split('');
      let i = 0;

      function typeNextChar() {
        if (i < chars.length) {
          const char = chars[i];
          reactSelectInput.dispatchEvent(new KeyboardEvent('keydown', {
            key: char, code: 'Key' + char.toUpperCase(), keyCode: char.charCodeAt(0),
            which: char.charCodeAt(0), bubbles: true
          }));

          // Update value character by character via native setter
          const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
          const currentVal = reactSelectInput.value + char;
          if (nativeSetter) {
            nativeSetter.call(reactSelectInput, currentVal);
          } else {
            reactSelectInput.value = currentVal;
          }

          reactSelectInput.dispatchEvent(new Event('input', { bubbles: true }));
          reactSelectInput.dispatchEvent(new Event('change', { bubbles: true }));

          reactSelectInput.dispatchEvent(new KeyboardEvent('keyup', {
            key: char, code: 'Key' + char.toUpperCase(), keyCode: char.charCodeAt(0),
            which: char.charCodeAt(0), bubbles: true
          }));

          i++;
          setTimeout(typeNextChar, 30);
        } else {
          // All characters typed, wait for suggestions then press Enter to confirm
          setTimeout(() => {
            reactSelectInput.dispatchEvent(new KeyboardEvent('keydown', {
              key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true
            }));
          }, 400);
        }
      }

      typeNextChar();
    }, true);
    btn.addEventListener('mousedown', (e) => e.stopPropagation(), true);
    menu.appendChild(btn);
  });

  dropdownContainer.appendChild(toggleBtn);
  dropdownContainer.appendChild(menu);

  toggleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    menu.classList.toggle('show');
  }, true);
  toggleBtn.addEventListener('mousedown', (e) => e.stopPropagation(), true);

  document.addEventListener('click', (e) => {
    if (!dropdownContainer.contains(e.target)) {
      menu.classList.remove('show');
    }
  }, true);

  // Insert into the field
  if (fieldControlDiv) {
    fieldControlDiv.appendChild(dropdownContainer);
  } else {
    tagsFieldContainer.appendChild(dropdownContainer);
  }
}


const observer = new MutationObserver((mutations) => {
  let shouldUpdateVisibility = false;

  for (let mutation of mutations) {
    if (mutation.addedNodes.length) {
      const toolbars = document.querySelectorAll('.StickyToolbar__Left-sc-e2eab97b-1');
      toolbars.forEach(toolbar => {
        injectButton(toolbar);
      });

      const inlineToolbars = Array.from(document.querySelectorAll('[class*="TextEditor__InlineToolbar"], [class*="TextEditorHelpers__Toolbar"]'))
        .filter(el => el.tagName === 'DIV' && !el.className.includes('Gap'));
      inlineToolbars.forEach(toolbar => {
        injectPreviewButton(toolbar);
      });

      const qaHeaders = document.querySelectorAll('[class*="AnswerForm__Header"]');
      qaHeaders.forEach(header => {
        injectQAButton(header);
      });

      const pyongWrappers = document.querySelectorAll('[class*="SongHeader-desktop__PyongWrapper"]');
      pyongWrappers.forEach(pw => {
        injectCoverArtChecker(pw);
      });


      // Metadata Tags dropdown
      injectMetadataTagsDropdown();

      shouldUpdateVisibility = true;
    }
    if (mutation.removedNodes.length) {
      shouldUpdateVisibility = true;
    }
  }

  // Use requestAnimationFrame or setTimeout to allow DOM to calculate layout
  if (shouldUpdateVisibility) {
    setTimeout(updateVisibility, 10);
  }
});

observer.observe(document.body, { childList: true, subtree: true });

// Check visibility frequently in case CSS displays toggles dynamically without DOM node changes
setInterval(() => {
  updateVisibility();

  // Yedek önlem olarak inline toolbarları da kontrol et
  const inlineToolbars = Array.from(document.querySelectorAll('[class*="TextEditor__InlineToolbar"], [class*="TextEditorHelpers__Toolbar"]'))
    .filter(el => el.tagName === 'DIV' && !el.className.includes('Gap'));
  inlineToolbars.forEach(toolbar => {
    injectPreviewButton(toolbar);
  });

  const qaHeaders = document.querySelectorAll('[class*="AnswerForm__Header"]');
  qaHeaders.forEach(header => {
    injectQAButton(header);
  });

  const pyongWrappers = document.querySelectorAll('[class*="SongHeader-desktop__PyongWrapper"]');
  pyongWrappers.forEach(pw => {
    injectCoverArtChecker(pw);
  });


  injectMetadataTagsDropdown();
}, 500);

setTimeout(() => {
  const toolbars = document.querySelectorAll('.StickyToolbar__Left-sc-e2eab97b-1');
  toolbars.forEach(toolbar => {
    injectButton(toolbar);
  });

  const inlineToolbars = Array.from(document.querySelectorAll('[class*="TextEditor__InlineToolbar"], [class*="TextEditorHelpers__Toolbar"]'))
    .filter(el => el.tagName === 'DIV' && !el.className.includes('Gap'));
  inlineToolbars.forEach(toolbar => {
    injectPreviewButton(toolbar);
  });

  const qaHeaders = document.querySelectorAll('[class*="AnswerForm__Header"]');
  qaHeaders.forEach(header => {
    injectQAButton(header);
  });

  const pyongWrappers = document.querySelectorAll('[class*="SongHeader-desktop__PyongWrapper"]');
  pyongWrappers.forEach(pw => {
    injectCoverArtChecker(pw);
  });


  injectMetadataTagsDropdown();

  updateVisibility();
}, 1000);

// Seçili metnin üzerine link yapıştırıldığında markdown formatına çeviren dinleyici
document.addEventListener('paste', function (e) {
  const target = e.target;

  // Annotation editörü textarea'sını tespit et (sınıflar değişebildiği için daha esnek bir kontrol yapıyoruz)
  const isAnnotationEditor = target && target.tagName === 'TEXTAREA' &&
    (target.classList.contains('AnnotationEditForm-desktop__TextEditor-sc-1330e9da-1') ||
      target.className.includes('AnnotationEditForm-desktop__TextEditor'));

  if (isAnnotationEditor) {
    const start = target.selectionStart;
    const end = target.selectionEnd;

    if (start !== undefined && end !== undefined && start !== end) {
      const pastedText = e.clipboardData.getData('text');

      if (!pastedText) return;

      // Basit bir URL kontrolü (http veya https ile başlayan ve boşluk içermeyen bir metin)
      const urlRegex = /^https?:\/\/[^\s]+$/i;

      if (urlRegex.test(pastedText.trim())) {
        e.preventDefault(); // Varsayılan yapıştırma işlemini engelle

        const fullText = target.value;
        const selectedText = fullText.substring(start, end);
        const url = pastedText.trim();

        // Markdown link formatı
        const markdownLink = `[${selectedText}](${url})`;

        // Tarayıcının geri alma (Ctrl+Z) geçmişini korumak için execCommand kullanıyoruz
        document.execCommand('insertText', false, markdownLink);
      }
    }
  }
});

// Seçili metin varken ", *, (, ), [, { tuşlarına basıldığında metni sarmalama
document.addEventListener('keydown', function (e) {
  const target = e.target;

  // Annotation editörü textarea'sını tespit et
  const isAnnotationEditor = target && target.tagName === 'TEXTAREA' &&
    (target.classList.contains('AnnotationEditForm-desktop__TextEditor-sc-1330e9da-1') ||
      target.className.includes('AnnotationEditForm-desktop__TextEditor'));

  if (isAnnotationEditor && (e.key === '"' || e.key === '*' || e.key === '(' || e.key === ')' || e.key === '[' || e.key === '{')) {
    const start = target.selectionStart;
    const end = target.selectionEnd;

    if (start !== undefined && end !== undefined && start !== end) {
      e.preventDefault(); // Varsayılan yazma işlemini engelle

      const fullText = target.value;
      let selectedText = fullText.substring(start, end);

      let openChar = e.key;
      let closeChar = e.key;

      if (openChar === '(' || openChar === ')') {
        openChar = '(';
        closeChar = ')';
        // Capitalize first letter
        if (selectedText.length > 0) {
          selectedText = selectedText.charAt(0).toUpperCase() + selectedText.slice(1);
        }
      }
      else if (openChar === '[') closeChar = ']';
      else if (openChar === '{') closeChar = '}';

      const wrappedText = `${openChar}${selectedText}${closeChar}`;

      // Tarayıcının geri alma (Ctrl+Z) geçmişini korumak için execCommand kullanıyoruz
      document.execCommand('insertText', false, wrappedText);
    }
  }
});

// Lyrics editor textarea: ( veya ) tuşuna basıldığında seçili metni paranteze al ve ilk harfi büyüt
document.addEventListener('keydown', function (e) {
  if (e.key !== '(' && e.key !== ')') return;

  const target = e.target;
  if (!target || target.tagName !== 'TEXTAREA') return;

  // Lyrics editor textarea'sını hedefle (annotation olanı zaten yukarıda yakalanıyor)
  const isLyricsEditor = target.matches('.LyricsEdit-desktop__Editor-sc-68d821bb-1 textarea, textarea[class*="LyricsTextareaInput"]');
  if (!isLyricsEditor) return;

  const start = target.selectionStart;
  const end = target.selectionEnd;

  if (start !== undefined && end !== undefined && start !== end) {
    e.preventDefault();
    wrapInParentheses(target);
  }
});

let currentTestedColors = null;

// Listener for Gradient Tester popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "saveGradient") {
    currentTestedColors = { color1: request.color1, color2: request.color2 };
    sendResponse({ success: true });
    return false;
  }

  if (request.action === "getGradient") {
    if (currentTestedColors) {
      sendResponse(currentTestedColors);
      return false;
    }

    // Sayfadaki orijinal gradyanı çekmeye çalış
    const header = document.querySelector('[data-testid="song-header"]') || document.querySelector('[class*="SongHeader-desktop__Container"]');
    if (header) {
      const style = window.getComputedStyle(header);
      const bgImage = style.backgroundImage;
      if (bgImage && bgImage.includes('linear-gradient')) {
        const colorRegex = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/g;
        const matches = [...bgImage.matchAll(colorRegex)];
        if (matches.length >= 2) {
          const toHex = (r, g, b) => {
            return "#" + [r, g, b].map(x => {
              const hex = parseInt(x).toString(16);
              return hex.length === 1 ? "0" + hex : hex;
            }).join("").toUpperCase();
          };
          const color1 = toHex(matches[0][1], matches[0][2], matches[0][3]);
          const color2 = toHex(matches[1][1], matches[1][2], matches[1][3]);
          sendResponse({ color1, color2 });
          return false;
        }
      }
    }

    sendResponse({});
    return false;
  }

  if (request.action === "testGradient") {
    currentTestedColors = { color1: request.color1, color2: request.color2 };
    const header = document.querySelector('[data-testid="song-header"]') || document.querySelector('[class*="SongHeader-desktop__Container"]');
    
    if (header) {
      // Create or update a specific style tag to ensure it overrides React styles safely
      let styleTag = document.getElementById("genius-veritas-tester-style");
      if (!styleTag) {
        styleTag = document.createElement("style");
        styleTag.id = "genius-veritas-tester-style";
        document.head.appendChild(styleTag);
      }
      
      styleTag.textContent = `
        [data-testid="song-header"], 
        [class*="SongHeader-desktop__Container"],
        [class*="About__Grid"] {
            background-image: linear-gradient(${request.color1}, ${request.color2}) !important;
        }
        nav#sticky-nav,
        [class*="StickyNav-desktop__Container"] {
            background-color: ${request.color1} !important;
            background-image: none !important;
        }
      `;
      
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, message: "Genius başlık (header) alanı bulunamadı." });
    }
    
    return true; // Asynchronous response required flag not strictly necessary here, but good practice
  }
});
