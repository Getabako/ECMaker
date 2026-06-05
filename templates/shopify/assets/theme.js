/* Generic Shopify theme — ECMaker baked behaviour.
   - Hero variants: image (static, optional slow Ken Burns), slider
     (opacity crossfade between up to 6 images), video-single (single
     muted loop), video-multi (up to 6 muted videos with circular wipe).
   - Brands/FAQ are hydrated from data-* JSON baked into the markup so
     the merchant has zero Shopify-admin editing surface. */
(function () {
  "use strict";

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function parseJsonAttr(el, attr) {
    if (!el) return null;
    var raw = el.getAttribute(attr);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  // ===== Hero: image =====
  function initHeroImage() {
    // Pure CSS — nothing to do. CSS may add a slow Ken Burns drift.
  }

  // ===== Hero: slider (opacity crossfade) =====
  function initHeroSlider() {
    var slider = document.getElementById("heroSlider");
    if (!slider) return;
    var images = (window.ECM && window.ECM.heroSlider) || [];
    if (!Array.isArray(images) || images.length < 2) return;

    // Build the remaining slides; the first one is already in the DOM.
    var first = slider.querySelector(".hero__slide");
    var slides = [first];
    for (var i = 1; i < images.length; i++) {
      var img = document.createElement("img");
      img.className = "hero__slide";
      img.src = images[i];
      img.alt = "";
      slider.appendChild(img);
      slides.push(img);
    }

    var idx = 0;
    var interval = (window.ECM && window.ECM.heroSliderIntervalMs) || 6000;
    setInterval(function () {
      slides[idx].classList.remove("is-active");
      idx = (idx + 1) % slides.length;
      slides[idx].classList.add("is-active");
    }, interval);
  }

  // ===== Hero: video-single =====
  function initHeroVideoSingle() {
    var v = document.getElementById("heroVideoSingle");
    if (!v) return;
    var p = v.play();
    if (p && p.catch) p.catch(function () {});
  }

  // ===== Hero: video-multi (circular wipe) =====
  function initHeroVideoMulti() {
    var urls = ((window.ECM && window.ECM.heroVideos) || []).filter(function (u) {
      return typeof u === "string" && u.length > 0;
    });
    if (urls.length === 0) return;

    var videoA = document.getElementById("heroVideoA");
    var videoB = document.getElementById("heroVideoB");
    if (!videoA || !videoB) return;

    var index = 0;
    var activeIsA = true;

    function setSrc(video, url) {
      if (!url) return;
      if (video.src !== url) {
        video.src = url;
        try { video.load(); } catch (e) {}
      }
    }

    videoA.classList.remove("is-hidden");
    videoB.classList.add("is-hidden");
    setSrc(videoA, urls[0]);
    var p = videoA.play();
    if (p && p.catch) p.catch(function () {});
    if (urls.length > 1) setSrc(videoB, urls[1]);

    function advance(direction) {
      if (urls.length < 2) return;
      direction = direction || 1;
      index = (index + direction + urls.length) % urls.length;

      var incoming = activeIsA ? videoB : videoA;
      var outgoing = activeIsA ? videoA : videoB;

      setSrc(incoming, urls[index]);
      try { incoming.currentTime = 0; } catch (e) {}
      var pp = incoming.play();
      if (pp && pp.catch) pp.catch(function () {});

      // eslint-disable-next-line no-unused-expressions
      incoming.offsetWidth;
      incoming.classList.remove("is-hidden");

      setTimeout(function () {
        outgoing.classList.add("is-hidden");
      }, 950);

      activeIsA = !activeIsA;

      var nextIndex = (index + 1) % urls.length;
      setTimeout(function () { setSrc(outgoing, urls[nextIndex]); }, 1200);
    }

    videoA.addEventListener("ended", function () { advance(1); });
    videoB.addEventListener("ended", function () { advance(1); });

    var prev = document.getElementById("heroPrev");
    var next = document.getElementById("heroNext");
    if (prev) prev.addEventListener("click", function () { advance(-1); });
    if (next) next.addEventListener("click", function () { advance(1); });
  }

  // ===== Brands hydration =====
  function initBrands() {
    var section = document.querySelector(".ecm-brands");
    if (!section) return;
    var grid = document.getElementById("ecmBrandGrid");
    var items = parseJsonAttr(section, "data-brands");
    if (!Array.isArray(items) || items.length === 0) {
      section.style.display = "none";
      return;
    }
    grid.innerHTML = items.map(function (name) {
      return '<div class="brand-grid__item">' + escapeHtml(name) + "</div>";
    }).join("");
  }

  // ===== FAQ hydration =====
  function initFaqs() {
    var box = document.getElementById("ecmFaq");
    if (!box) return;
    var items = parseJsonAttr(box, "data-faqs");
    if (!Array.isArray(items) || items.length === 0) {
      box.style.display = "none";
      return;
    }
    box.innerHTML = items.map(function (it) {
      return (
        "<details><summary>" + escapeHtml(it.q) +
        "</summary><p>" + escapeHtml(it.a) + "</p></details>"
      );
    }).join("");
  }

  ready(function () {
    var type = (window.ECM && window.ECM.heroType) || "image";
    if (type === "image") initHeroImage();
    else if (type === "slider") initHeroSlider();
    else if (type === "video-single") initHeroVideoSingle();
    else if (type === "video-multi") initHeroVideoMulti();
    initBrands();
    initFaqs();
  });
})();
