let currentPlaybackSpeed = 1.0;
let preservePitch = true;

function applyPlaybackSpeed() {
    window.dispatchEvent(new CustomEvent('genius-speed-change', {
        detail: { speed: currentPlaybackSpeed, preservePitch: preservePitch }
    }));
}

function injectSpeedControl() {
    if (document.querySelector('.genius-speed-toggle')) return;

    const volumeBarContainer = document.querySelector('[data-testid="volume-bar"]')?.parentElement;
    if (!volumeBarContainer || !volumeBarContainer.parentElement) return;

    // Inject Styles
    if (!document.getElementById('genius-spotify-speed-styles')) {
        const style = document.createElement('style');
        style.id = 'genius-spotify-speed-styles';
        style.textContent = `
            .genius-speed-popup {
                display: none;
                position: absolute;
                background: #282828;
                border-radius: 8px;
                padding: 16px;
                box-shadow: 0 16px 24px rgba(0,0,0,0.3), 0 6px 8px rgba(0,0,0,0.2);
                z-index: 9999;
                font-family: 'CircularSp', var(--fallback-fonts, sans-serif);
                color: #fff;
                width: 260px;
                margin-left: -130px; /* Center relative to button */
            }
            .genius-speed-popup.active {
                display: block;
            }
            .genius-speed-slider {
                -webkit-appearance: none;
                width: 100%;
                height: 4px;
                background: #535353;
                border-radius: 2px;
                outline: none;
                margin: 0;
            }
            .genius-speed-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: #fff;
                cursor: pointer;
                box-shadow: 0 2px 4px rgba(0,0,0,0.5);
            }
            .genius-speed-slider::-webkit-slider-thumb:hover {
                transform: scale(1.2);
            }
            .genius-toggle-switch {
                position: relative;
                display: inline-block;
                width: 32px;
                height: 16px;
            }
            .genius-toggle-switch input {
                opacity: 0;
                width: 0;
                height: 0;
            }
            .genius-toggle-slider {
                position: absolute;
                cursor: pointer;
                top: 0; left: 0; right: 0; bottom: 0;
                background-color: #535353;
                transition: .2s;
                border-radius: 16px;
            }
            .genius-toggle-slider:before {
                position: absolute;
                content: "";
                height: 12px;
                width: 12px;
                left: 2px;
                bottom: 2px;
                background-color: white;
                transition: .2s;
                border-radius: 50%;
            }
            .genius-toggle-switch input:checked + .genius-toggle-slider {
                background-color: #1ed760;
            }
            .genius-toggle-switch input:checked + .genius-toggle-slider:before {
                transform: translateX(16px);
            }
            .genius-btn-reset {
                background: rgba(255,255,255,0.1);
                border: none;
                color: #fff;
                padding: 4px 12px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 700;
                cursor: pointer;
                transition: background 0.2s, transform 0.1s;
            }
            .genius-btn-reset:hover {
                background: rgba(255,255,255,0.2);
                transform: scale(1.05);
            }
            .genius-btn-reset:active {
                transform: scale(0.95);
            }
            .genius-speed-toggle {
                background: transparent;
                border: none;
                color: #b3b3b3;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                margin: 0 8px;
                min-width: 32px;
                gap: 2px;
                transition: color 0.2s;
            }
            .genius-speed-toggle:hover {
                color: #fff;
            }
        `;
        document.head.appendChild(style);
    }

    // Main Toggle Button
    const btn = document.createElement("button");
    btn.className = "genius-speed-toggle";
    btn.setAttribute("aria-label", "Playback Speed");
    btn.title = "Playback Speed";
    
    // SVG Icon
    const svgIcon = `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" stroke="currentColor" fill="none"></circle>
            <polygon points="10 8 16 12 10 16 10 8" stroke="none" fill="currentColor"></polygon>
        </svg>
    `;
    
    const spanText = document.createElement("span");
    spanText.style.cssText = "font-size: 10px; font-weight: 700; font-family: 'CircularSp', var(--fallback-fonts, sans-serif);";
    spanText.textContent = currentPlaybackSpeed.toFixed(2) + "x";
    
    if (currentPlaybackSpeed !== 1.0) {
        spanText.style.color = "#1ed760";
        btn.style.color = "#1ed760";
    }

    btn.innerHTML = svgIcon;
    btn.appendChild(spanText);

    // Popup Container
    const popup = document.createElement("div");
    popup.className = "genius-speed-popup";
    
    popup.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="margin: 0; font-size: 16px; font-weight: 700;">Playback Speed</h3>
        </div>
        
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
            <span style="font-size: 13px; color: #b3b3b3; width: 30px;">0.5x</span>
            <input type="range" id="genius-speed-slider" class="genius-speed-slider" min="0.5" max="2.0" step="0.05" value="${currentPlaybackSpeed}">
            <span style="font-size: 13px; color: #b3b3b3; width: 30px; text-align: right;">2x</span>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px; font-weight: 400; color: #1ed760;">
                <label class="genius-toggle-switch">
                    <input type="checkbox" id="genius-pitch-toggle" ${preservePitch ? 'checked' : ''}>
                    <span class="genius-toggle-slider"></span>
                </label>
                Preserve Pitch
            </label>
            
            <button id="genius-speed-reset" class="genius-btn-reset">1x</button>
        </div>
    `;

    document.body.appendChild(popup);
    volumeBarContainer.parentElement.insertBefore(btn, volumeBarContainer);

    // Logic Elements
    const slider = popup.querySelector('#genius-speed-slider');
    const pitchToggle = popup.querySelector('#genius-pitch-toggle');
    const resetBtn = popup.querySelector('#genius-speed-reset');

    // Update UI Function
    const updateUI = (speed) => {
        currentPlaybackSpeed = parseFloat(speed);
        slider.value = currentPlaybackSpeed;
        spanText.textContent = currentPlaybackSpeed.toFixed(2) + "x";
        
        if (currentPlaybackSpeed !== 1.0) {
            spanText.style.color = "#1ed760";
            btn.style.color = "#1ed760";
        } else {
            spanText.style.color = "#b3b3b3";
            btn.style.color = "#b3b3b3";
        }
        
        applyPlaybackSpeed();
    };

    // Events
    btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isActive = popup.classList.contains('active');
        
        if (!isActive) {
            // Position popup dynamically based on button
            const rect = btn.getBoundingClientRect();
            popup.style.left = (rect.left + rect.width / 2) + 'px';
            popup.style.bottom = (window.innerHeight - rect.top + 10) + 'px';
            popup.classList.add('active');
        } else {
            popup.classList.remove('active');
        }
    });

    document.addEventListener("click", (e) => {
        if (!popup.contains(e.target) && !btn.contains(e.target)) {
            popup.classList.remove('active');
        }
    });

    slider.addEventListener('input', (e) => {
        updateUI(e.target.value);
    });

    pitchToggle.addEventListener('change', (e) => {
        preservePitch = e.target.checked;
        applyPlaybackSpeed();
    });

    resetBtn.addEventListener('click', () => {
        updateUI(1.0);
    });
}

function createDownloadButton(moreBtn) {
    const btn = document.createElement("button");
    btn.className = moreBtn.className + " genius-spotify-dl-btn";
    btn.setAttribute("aria-label", "Kapağı İndir (1000x1000 PNG)");
    
    // Copy data attributes
    for (let attr of moreBtn.attributes) {
        if (attr.name.startsWith('data-')) {
            btn.setAttribute(attr.name, attr.value);
        }
    }
    
    btn.innerHTML = moreBtn.innerHTML;
    const svgContainer = btn.querySelector('svg');
    if (svgContainer) {
        const svgHTML = `<svg data-encore-id="icon" role="img" aria-hidden="true" class="${svgContainer.getAttribute('class') || ''}" viewBox="0 0 24 24" style="${svgContainer.getAttribute('style') || ''}"><path fill="currentColor" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"></path></svg>`;
        svgContainer.outerHTML = svgHTML;
    }

    btn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            let imgUrl = null;
            
            // SPA'larda (Spotify) meta etiketleri sayfa değişiminde güncellenmeyebilir.
            // Bu yüzden doğrudan sayfanın ana içeriğindeki (main) ilk büyük resmi alıyoruz.
            // 'main' etiketi içinde aradığımız için alt kısımdaki 'şu an çalan' widget'ını (footer) yoksaymış oluyoruz.
            const mainContent = document.querySelector('main');
            if (mainContent) {
                const imgs = mainContent.querySelectorAll('img[src*="i.scdn.co/image/"]');
                for (const img of imgs) {
                    const rect = img.getBoundingClientRect();
                    // Header'daki kapak genelde 150x150'den büyüktür
                    if (rect.width > 100 || img.width > 100) {
                        imgUrl = img.src;
                        if (img.srcset) {
                            const sources = img.srcset.split(',').map(s => s.trim().split(' '));
                            sources.sort((a, b) => parseInt(b[1]) - parseInt(a[1]));
                            imgUrl = sources[0][0]; // En yüksek çözünürlüğü seç
                        }
                        break; // İlk büyük resmi bulduğumuzda dur
                    }
                }
            }

            if (!imgUrl) {
                alert("Kapak fotoğrafı bulunamadı.");
                return;
            }

            // Replace resolution prefix to get the 640x640 version (b273)
            imgUrl = imgUrl.replace(/0000[0-9a-f]{4}/i, '0000b273');

            btn.style.opacity = "0.5";
            btn.style.pointerEvents = "none";

            let title = document.title.split(' | ')[0].replace(' - Album by ', ' - ');
            title = title.replace(/[<>:"/\\|?*]+/g, '').trim();

            await downloadAs1000x1000PNG(imgUrl, title);

        } catch (err) {
            console.error("Cover download error:", err);
            alert("İndirme sırasında bir hata oluştu.");
        } finally {
            btn.style.opacity = "1";
            btn.style.pointerEvents = "auto";
        }
    });

    return btn;
}

async function downloadAs1000x1000PNG(url, title) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = 1000;
            canvas.height = 1000;
            const ctx = canvas.getContext("2d");
            
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            
            ctx.drawImage(img, 0, 0, 1000, 1000);
            
            canvas.toBlob((blob) => {
                if (!blob) return reject(new Error("Canvas to Blob failed"));
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = blobUrl;
                a.download = `${title}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(blobUrl);
                resolve();
            }, "image/png");
        };
        img.onerror = () => reject(new Error("Image failed to load"));
        img.src = url;
    });
}

function injectSpotifyButton() {
    if (!window.location.pathname.startsWith('/album/')) return;

    const moreBtns = document.querySelectorAll('button[data-testid="more-button"]');
    
    moreBtns.forEach(moreBtn => {
        // Zaten bu butonun yanına eklemiş miyiz kontrol et
        const nextNode = moreBtn.nextElementSibling;
        if (nextNode && nextNode.classList.contains('genius-spotify-dl-btn')) {
            return;
        }

        // Aynı kapsayıcıda (parent) varsa tekrar ekleme
        if (moreBtn.parentNode.querySelector('.genius-spotify-dl-btn')) {
            return;
        }

        const dlBtn = createDownloadButton(moreBtn);
        moreBtn.parentNode.insertBefore(dlBtn, moreBtn.nextSibling);
    });
}

const observer = new MutationObserver((mutations) => {
    let shouldCheck = false;
    for (const mutation of mutations) {
        if (mutation.addedNodes.length) {
            shouldCheck = true;
            break;
        }
    }
    if (shouldCheck) {
        injectSpotifyButton();
        injectSpeedControl();
    }
});

observer.observe(document.documentElement, { childList: true, subtree: true });

setInterval(() => {
    injectSpotifyButton();
    injectSpeedControl();
    // Don't need to continuously apply playback speed if the page script handles intercepting it.
    // But we can dispatch the event occasionally just in case a new video element was added without a trigger.
    applyPlaybackSpeed();
}, 1000);
