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
    }
});

observer.observe(document.body, { childList: true, subtree: true });

setInterval(injectSpotifyButton, 1000);
