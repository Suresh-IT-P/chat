// =============================================
// IMAGE VIEWER Component
// =============================================

const ImageViewer = {
  show(src) {
    const overlay = document.createElement('div');
    overlay.className = 'image-viewer-overlay';
    overlay.innerHTML = `
      <button class="image-viewer-close">✕</button>
      <img src="${src}" alt="Full size image">
    `;

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.classList.contains('image-viewer-close')) {
        overlay.style.animation = 'fadeOut 0.2s ease forwards';
        setTimeout(() => overlay.remove(), 200);
      }
    });

    document.body.appendChild(overlay);
  }
};
