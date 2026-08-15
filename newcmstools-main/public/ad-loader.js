/**
 * AdPush Universal High-Performance Embeddable Ad Loader
 * For Cloudflare Pages & D1 Real-Time Advertising Delivery
 *
 * Usage on any website:
 * <div id="header-ad"></div>
 * <!-- or <div data-ad-placement="sidebar-ad"></div> -->
 * <script src="https://YOUR-CLOUDFLARE-PAGES-DOMAIN.com/ad-loader.js" async></script>
 */

(function () {
  'use strict';

  // Determine API base host from script tag or current location
  const currentScript = document.currentScript || (function () {
    const scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  let apiBase = '';
  if (currentScript && currentScript.src) {
    try {
      const url = new URL(currentScript.src);
      apiBase = url.origin;
    } catch (e) {
      apiBase = '';
    }
  }

  // Device detection helper
  function getDeviceType() {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  }

  // Track recorded impressions to avoid duplicates per session
  const trackedImpressions = new Set();

  function recordImpression(ad, placementKey) {
    const trackKey = `${ad.id}_${placementKey}`;
    if (trackedImpressions.has(trackKey)) return;
    trackedImpressions.add(trackKey);

    const payload = {
      ad_id: ad.id,
      campaign_id: ad.campaign_id || null,
      placement_id: placementKey,
      page_url: window.location.href,
      referrer: document.referrer || '',
      device_type: getDeviceType()
    };

    const impressionEndpoint = `${apiBase}/api/ads/impression`;

    if (navigator.sendBeacon) {
      try {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon(impressionEndpoint, blob);
        return;
      } catch (err) {
        // Fallback to fetch
      }
    }

    fetch(impressionEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(function () {});
  }

  function createAdElement(ad, placementKey) {
    const container = document.createElement('div');
    container.className = 'adpush-container adpush-type-' + (ad.ad_type || 'image');
    container.style.position = 'relative';
    container.style.display = 'inline-block';
    container.style.width = '100%';
    container.style.maxWidth = '100%';
    container.style.boxSizing = 'border-box';
    container.style.overflow = 'hidden';

    // Click tracking URL
    const clickUrl = `${apiBase}/api/ads/click?ad_id=${encodeURIComponent(ad.id)}&placement=${encodeURIComponent(placementKey)}&dest=${encodeURIComponent(ad.destination_url)}`;
    const targetAttr = ad.open_new_tab === 1 || ad.open_new_tab === true || ad.open_new_tab === '1' ? '_blank' : '_self';

    // Render ad content based on type
    if (ad.ad_type === 'video' || ad.media_type === 'video') {
      const link = document.createElement('a');
      link.href = clickUrl;
      link.target = targetAttr;
      link.rel = 'noopener noreferrer';
      link.style.display = 'block';
      link.style.width = '100%';
      link.style.textDecoration = 'none';

      const video = document.createElement('video');
      video.src = ad.media_url;
      video.style.width = '100%';
      video.style.height = 'auto';
      video.style.display = 'block';
      video.style.borderRadius = '6px';
      video.playsInline = true;
      video.muted = ad.video_muted !== 0 && ad.video_muted !== false;
      video.autoplay = ad.video_autoplay !== 0 && ad.video_autoplay !== false;
      video.loop = ad.video_loop !== 0 && ad.video_loop !== false;
      if (ad.video_controls === 1 || ad.video_controls === true) {
        video.controls = true;
      }

      link.appendChild(video);
      container.appendChild(link);
    } else if (ad.ad_type === 'native') {
      // Native Ad styling
      const nativeBox = document.createElement('div');
      nativeBox.style.padding = '14px';
      nativeBox.style.borderRadius = '8px';
      nativeBox.style.border = '1px solid #e2e8f0';
      nativeBox.style.backgroundColor = '#ffffff';
      nativeBox.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
      nativeBox.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

      const link = document.createElement('a');
      link.href = clickUrl;
      link.target = targetAttr;
      link.rel = 'noopener noreferrer';
      link.style.textDecoration = 'none';
      link.style.color = 'inherit';
      link.style.display = 'flex';
      link.style.gap = '12px';
      link.style.alignItems = 'center';

      if (ad.media_url) {
        const img = document.createElement('img');
        img.src = ad.media_url;
        img.alt = ad.name || 'Advertisement';
        img.style.width = '80px';
        img.style.height = '80px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '6px';
        img.style.flexShrink = '0';
        link.appendChild(img);
      }

      const content = document.createElement('div');
      content.style.flex = '1';

      const sponsored = document.createElement('div');
      sponsored.innerText = 'Promoted';
      sponsored.style.fontSize = '11px';
      sponsored.style.fontWeight = '600';
      sponsored.style.textTransform = 'uppercase';
      sponsored.style.letterSpacing = '0.5px';
      sponsored.style.color = '#3b82f6';
      sponsored.style.marginBottom = '2px';
      content.appendChild(sponsored);

      if (ad.headline || ad.name) {
        const title = document.createElement('h4');
        title.innerText = ad.headline || ad.name;
        title.style.margin = '0 0 4px 0';
        title.style.fontSize = '15px';
        title.style.fontWeight = '600';
        title.style.color = '#0f172a';
        content.appendChild(title);
      }

      if (ad.description) {
        const desc = document.createElement('p');
        desc.innerText = ad.description;
        desc.style.margin = '0 0 6px 0';
        desc.style.fontSize = '13px';
        desc.style.color = '#64748b';
        desc.style.lineHeight = '1.4';
        content.appendChild(desc);
      }

      const cta = document.createElement('span');
      cta.innerText = (ad.call_to_action || 'Learn More') + ' →';
      cta.style.fontSize = '13px';
      cta.style.fontWeight = '600';
      cta.style.color = '#2563eb';
      content.appendChild(cta);

      link.appendChild(content);
      nativeBox.appendChild(link);
      container.appendChild(nativeBox);
    } else if (ad.ad_type === 'popup') {
      // Interstitial / Popup Ad overlay
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100vw';
      overlay.style.height = '100vh';
      overlay.style.backgroundColor = 'rgba(15, 23, 42, 0.7)';
      overlay.style.backdropFilter = 'blur(4px)';
      overlay.style.zIndex = '999999';
      overlay.style.display = 'flex';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      overlay.style.padding = '20px';
      overlay.style.boxSizing = 'border-box';

      const modal = document.createElement('div');
      modal.style.position = 'relative';
      modal.style.backgroundColor = '#ffffff';
      modal.style.borderRadius = '12px';
      modal.style.overflow = 'hidden';
      modal.style.maxWidth = '500px';
      modal.style.width = '100%';
      modal.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';

      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '&times;';
      closeBtn.style.position = 'absolute';
      closeBtn.style.top = '10px';
      closeBtn.style.right = '10px';
      closeBtn.style.width = '32px';
      closeBtn.style.height = '32px';
      closeBtn.style.borderRadius = '50%';
      closeBtn.style.border = 'none';
      closeBtn.style.backgroundColor = 'rgba(0,0,0,0.6)';
      closeBtn.style.color = '#ffffff';
      closeBtn.style.fontSize = '20px';
      closeBtn.style.lineHeight = '1';
      closeBtn.style.cursor = 'pointer';
      closeBtn.style.zIndex = '10';
      closeBtn.onclick = function (e) {
        e.stopPropagation();
        overlay.remove();
      };
      modal.appendChild(closeBtn);

      const link = document.createElement('a');
      link.href = clickUrl;
      link.target = targetAttr;
      link.rel = 'noopener noreferrer';
      link.style.display = 'block';
      link.style.textDecoration = 'none';

      if (ad.media_url) {
        if (ad.media_type === 'video') {
          const vid = document.createElement('video');
          vid.src = ad.media_url;
          vid.style.width = '100%';
          vid.style.display = 'block';
          vid.autoplay = true;
          vid.muted = true;
          vid.loop = true;
          vid.playsInline = true;
          link.appendChild(vid);
        } else {
          const img = document.createElement('img');
          img.src = ad.media_url;
          img.alt = ad.name || 'Ad';
          img.style.width = '100%';
          img.style.display = 'block';
          link.appendChild(img);
        }
      }

      if (ad.headline || ad.description) {
        const body = document.createElement('div');
        body.style.padding = '16px';
        if (ad.headline) {
          const h3 = document.createElement('h3');
          h3.innerText = ad.headline;
          h3.style.margin = '0 0 6px 0';
          h3.style.fontSize = '18px';
          h3.style.color = '#0f172a';
          body.appendChild(h3);
        }
        if (ad.description) {
          const p = document.createElement('p');
          p.innerText = ad.description;
          p.style.margin = '0 0 12px 0';
          p.style.fontSize = '14px';
          p.style.color = '#64748b';
          body.appendChild(p);
        }
        const btn = document.createElement('button');
        btn.innerText = ad.call_to_action || 'Learn More';
        btn.style.backgroundColor = '#2563eb';
        btn.style.color = '#ffffff';
        btn.style.border = 'none';
        btn.style.padding = '10px 20px';
        btn.style.borderRadius = '6px';
        btn.style.fontWeight = '600';
        btn.style.cursor = 'pointer';
        btn.style.width = '100%';
        body.appendChild(btn);
        link.appendChild(body);
      }

      modal.appendChild(link);
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
      return container; // return empty container for the placement node
    } else {
      // Standard Image / Banner Ad
      const link = document.createElement('a');
      link.href = clickUrl;
      link.target = targetAttr;
      link.rel = 'noopener noreferrer';
      link.style.display = 'block';
      link.style.width = '100%';
      link.style.textDecoration = 'none';

      const img = document.createElement('img');
      img.src = ad.media_url;
      img.alt = ad.name || 'Advertisement';
      img.style.width = '100%';
      img.style.height = 'auto';
      img.style.display = 'block';
      img.style.borderRadius = '6px';
      img.loading = 'lazy';

      link.appendChild(img);
      container.appendChild(link);
    }

    // Add tiny "Ad" label tag
    const adBadge = document.createElement('span');
    adBadge.innerText = 'AD';
    adBadge.style.position = 'absolute';
    adBadge.style.bottom = '4px';
    adBadge.style.right = '4px';
    adBadge.style.backgroundColor = 'rgba(0,0,0,0.6)';
    adBadge.style.color = '#ffffff';
    adBadge.style.fontSize = '9px';
    adBadge.style.fontWeight = 'bold';
    adBadge.style.padding = '1px 4px';
    adBadge.style.borderRadius = '3px';
    adBadge.style.pointerEvents = 'none';
    adBadge.style.letterSpacing = '0.5px';
    container.appendChild(adBadge);

    return container;
  }

  // Load ads for a specific placement element
  async function loadPlacement(el) {
    let placementKey = el.getAttribute('data-ad-placement') || el.id;
    if (!placementKey) return;

    // Normalize known IDs (e.g., reelsnip-ad-header -> header-ad)
    if (placementKey.startsWith('reelsnip-ad-')) {
      placementKey = placementKey.replace('reelsnip-ad-', '') + '-ad';
    }

    try {
      const pageParam = encodeURIComponent(window.location.pathname);
      const res = await fetch(`${apiBase}/api/ads/active?placement=${encodeURIComponent(placementKey)}&page=${pageParam}`);
      if (!res.ok) return;

      const data = await res.json();
      if (!data || !data.ad) {
        // No active ad scheduled for this placement
        return;
      }

      const ad = data.ad;
      el.innerHTML = '';
      const adElement = createAdElement(ad, placementKey);
      el.appendChild(adElement);

      // Track impression when visible in viewport
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
              recordImpression(ad, placementKey);
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.5 });
        observer.observe(el);
      } else {
        recordImpression(ad, placementKey);
      }
    } catch (err) {
      console.warn('[AdPush] Failed to load placement:', placementKey, err);
    }
  }

  // Initialize all placements on the page
  function initAllPlacements() {
    // 1. Check elements with data-ad-placement
    const dataElements = document.querySelectorAll('[data-ad-placement]');
    dataElements.forEach(loadPlacement);

    // 2. Check standard IDs
    const standardIds = [
      'header-ad', 'top-banner', 'sidebar-ad', 'article-ad', 'in-content-ad',
      'footer-ad', 'video-ad', 'popup-ad', 'reelsnip-ad-header', 'reelsnip-ad-sidebar',
      'reelsnip-ad-article', 'reelsnip-ad-footer'
    ];

    standardIds.forEach(function (id) {
      const el = document.getElementById(id);
      if (el && !el.hasAttribute('data-ad-placement')) {
        loadPlacement(el);
      }
    });
  }

  // Auto initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllPlacements);
  } else {
    initAllPlacements();
  }

  // Expose global controller
  window.AdPushLoader = {
    init: initAllPlacements,
    loadPlacement: loadPlacement,
    refresh: function (elementOrId) {
      const el = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
      if (el) loadPlacement(el);
    },
    version: '2.0.0-cloudflare'
  };
})();
