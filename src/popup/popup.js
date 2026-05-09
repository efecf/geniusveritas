document.addEventListener('DOMContentLoaded', () => {
    const color1Input = document.getElementById('color1');
    const hex1Input = document.getElementById('hex1');
    const contrast1Badge = document.querySelector('#contrast1 .badge');
    const contrast1Ratio = document.querySelector('#contrast1 .contrast-ratio');

    const color2Input = document.getElementById('color2');
    const hex2Input = document.getElementById('hex2');
    const contrast2Badge = document.querySelector('#contrast2 .badge');
    const contrast2Ratio = document.querySelector('#contrast2 .contrast-ratio');

    const previewBox = document.getElementById('preview-box');
    const btnTest = document.getElementById('btn-test');
    const btnCopy = document.getElementById('btn-copy');
    const statusMsg = document.getElementById('status-msg');

    // Utility: Hex to RGB
    function hexToRgb(hex) {
        let shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
        let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    // Utility: Luminance calculation
    function getLuminance(r, g, b) {
        let a = [r, g, b].map(function (v) {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    }

    // Utility: Calculate Contrast with White (#FFFFFF)
    function calculateContrast(hex) {
        const rgb = hexToRgb(hex);
        if (!rgb) return 1;
        const lum = getLuminance(rgb.r, rgb.g, rgb.b);
        const whiteLum = 1.0;
        return (whiteLum + 0.05) / (lum + 0.05);
    }

    function updateContrastUI(ratio, badgeEl, ratioEl) {
        const formattedRatio = ratio.toFixed(2);
        ratioEl.textContent = `${formattedRatio}:1`;

        badgeEl.className = 'badge';
        if (ratio >= 4.5) {
            badgeEl.classList.add('badge-success');
            badgeEl.textContent = 'PASS AA';
        } else if (ratio >= 3.0) {
            badgeEl.classList.add('badge-warning');
            badgeEl.textContent = 'PASS LG';
            badgeEl.title = 'Large Text Only';
        } else {
            badgeEl.classList.add('badge-error');
            badgeEl.textContent = 'FAIL';
        }
    }

    function updatePreview() {
        const c1 = color1Input.value;
        const c2 = color2Input.value;
        previewBox.style.backgroundImage = `linear-gradient(${c1}, ${c2})`;
    }

    function syncColors(saveState = true) {
        // Sync hex inputs with color pickers
        let c1 = hex1Input.value;
        if (c1.length === 7 && c1.startsWith('#')) {
            color1Input.value = c1;
        } else {
            c1 = color1Input.value;
        }

        let c2 = hex2Input.value;
        if (c2.length === 7 && c2.startsWith('#')) {
            color2Input.value = c2;
        } else {
            c2 = color2Input.value;
        }

        const ratio1 = calculateContrast(c1);
        const ratio2 = calculateContrast(c2);

        updateContrastUI(ratio1, contrast1Badge, contrast1Ratio);
        updateContrastUI(ratio2, contrast2Badge, contrast2Ratio);

        // Disable buttons if any contrast ratio is below 3.0
        const isFailed = ratio1 < 3.0 || ratio2 < 3.0;
        btnTest.disabled = isFailed;
        btnCopy.disabled = isFailed;

        updatePreview();

        if (saveState) {
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                const currentTab = tabs[0];
                if (currentTab && currentTab.url && currentTab.url.includes("genius.com")) {
                    chrome.tabs.sendMessage(currentTab.id, {
                        action: "saveGradient",
                        color1: c1,
                        color2: c2
                    }).catch(() => {}); // ignore errors if script not injected
                }
            });
        }
    }

    function showStatus(msg, isError = false) {
        statusMsg.textContent = msg;
        statusMsg.style.color = isError ? 'var(--error-text)' : 'var(--success-text)';
        statusMsg.classList.add('show');
        setTimeout(() => {
            statusMsg.classList.remove('show');
        }, 2000);
    }

    // Event Listeners for Colors
    color1Input.addEventListener('input', () => {
        hex1Input.value = color1Input.value.toUpperCase();
        syncColors();
    });
    hex1Input.addEventListener('input', syncColors);

    color2Input.addEventListener('input', () => {
        hex2Input.value = color2Input.value.toUpperCase();
        syncColors();
    });
    hex2Input.addEventListener('input', syncColors);

    // Initial Sync & State Loading
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const currentTab = tabs[0];
        if (currentTab && currentTab.url && currentTab.url.includes("genius.com")) {
            chrome.tabs.sendMessage(currentTab.id, { action: "getGradient" }, (response) => {
                if (!chrome.runtime.lastError && response && response.color1 && response.color2) {
                    color1Input.value = response.color1;
                    hex1Input.value = response.color1.toUpperCase();
                    color2Input.value = response.color2;
                    hex2Input.value = response.color2.toUpperCase();
                }
                syncColors(false);
            });
        } else {
            syncColors(false);
        }
    });

    // Copy Button
    btnCopy.addEventListener('click', () => {
        const c1 = color1Input.value;
        const c2 = color2Input.value;
        const cssCode = `${c1}, ${c2}`;
        navigator.clipboard.writeText(cssCode).then(() => {
            showStatus("CSS Kopyalandı!");
        });
    });

    // Test on Page Button
    btnTest.addEventListener('click', () => {
        const c1 = color1Input.value;
        const c2 = color2Input.value;

        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            const currentTab = tabs[0];
            if (!currentTab || !currentTab.url) {
                showStatus("Sayfa verisi alınamadı (İzinleri kontrol edin).", true);
                return;
            }
            if (!currentTab.url.includes("genius.com")) {
                showStatus("Lütfen bir Genius sayfasında kullanın.", true);
                return;
            }

            chrome.tabs.sendMessage(currentTab.id, {
                action: "testGradient",
                color1: c1,
                color2: c2
            }, (response) => {
                if (chrome.runtime.lastError) {
                    showStatus("Sayfa bağlantısı kurulamadı. Lütfen sayfayı yenileyin.", true);
                } else if (response && response.success) {
                    showStatus("Test başarılı!");
                } else {
                    showStatus(response ? response.message : "Bilinmeyen hata", true);
                }
            });
        });
    });

    // --- Tabs Logic ---
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            const target = tab.getAttribute('data-target');
            document.getElementById(target).classList.add('active');
        });
    });

    // --- Options Logic ---
    const toggleRedAnnotations = document.getElementById('toggle-red-annotations');
    
    // Load state
    chrome.storage.local.get(['removeRedAnnotations'], (result) => {
        toggleRedAnnotations.checked = !!result.removeRedAnnotations;
    });

    // Save state
    toggleRedAnnotations.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        chrome.storage.local.set({ removeRedAnnotations: isChecked });
        
        // Notify active tab
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            const currentTab = tabs[0];
            if (currentTab && currentTab.url && currentTab.url.includes("genius.com")) {
                chrome.tabs.sendMessage(currentTab.id, {
                    action: "toggleRedAnnotations",
                    state: isChecked
                }).catch(() => {});
            }
        });
    });
});
