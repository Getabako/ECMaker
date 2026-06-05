/* Generic Shopify theme — hero video slideshow with circular clip-path wipe.
   All videos are muted; auto-advances on `ended`; prev/next buttons. */
(function () {
  "use strict";

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    var urls = (window.SHOP_HERO_VIDEOS || []).filter(function (u) {
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

    // Initial: A is visible, B is hidden behind a 0-radius circle.
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

      // Reveal the incoming layer with a circular wipe.
      // Force reflow so the transition from is-hidden -> revealed plays.
      // eslint-disable-next-line no-unused-expressions
      incoming.offsetWidth;
      incoming.classList.remove("is-hidden");

      // After the wipe completes, hide the outgoing layer instantly
      // (no transition) so the next reveal works.
      setTimeout(function () {
        outgoing.classList.add("is-hidden");
      }, 950);

      activeIsA = !activeIsA;

      // Preload the next video into the now-outgoing slot.
      var nextIndex = (index + 1) % urls.length;
      setTimeout(function () { setSrc(outgoing, urls[nextIndex]); }, 1200);
    }

    videoA.addEventListener("ended", function () { advance(1); });
    videoB.addEventListener("ended", function () { advance(1); });

    var prev = document.getElementById("heroPrev");
    var next = document.getElementById("heroNext");
    if (prev) prev.addEventListener("click", function () { advance(-1); });
    if (next) next.addEventListener("click", function () { advance(1); });
  });
})();
