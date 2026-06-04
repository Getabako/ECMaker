/* ============================================================
   THEME TOGGLE — dark default, radial-reveal wipe to light/back
   ============================================================ */
(() => {
  const root = document.documentElement;
  const btn = document.getElementById('themeToggle');
  if(!btn) return;
  const saved = localStorage.getItem('neoaid_theme');
  if(saved === 'light') root.setAttribute('data-theme', 'light');

  function applyTheme(next, originX, originY){
    const wipe = document.createElement('div');
    wipe.className = 'theme-wipe ' + (next === 'light' ? 'to-light' : 'to-dark');
    wipe.style.setProperty('--wipe-x', originX + 'px');
    wipe.style.setProperty('--wipe-y', originY + 'px');
    document.body.appendChild(wipe);
    requestAnimationFrame(() => { wipe.classList.add('phase-expand'); });
    setTimeout(() => {
      if(next === 'light') root.setAttribute('data-theme', 'light');
      else root.removeAttribute('data-theme');
      localStorage.setItem('neoaid_theme', next);
      wipe.classList.remove('phase-expand');
      wipe.classList.add('phase-contract');
    }, 550);
    setTimeout(() => { wipe.remove(); }, 1150);
  }

  btn.addEventListener('click', (e) => {
    const rect = btn.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    applyTheme(next, x, y);
  });
})();

/* ============================================================
   WHIP-SLIDE CHANNEL SWITCH — hero headline cycles with whip blur
   ============================================================ */
(() => {
  const h1 = document.getElementById('heroHead');
  if(!h1) return;
  const CHANNELS = [
    '<span class="jit">CHILL</span><br/><span class="acid jit">BEYOND</span><br/><span class="jit">THE</span> <span class="blood jit">LIMIT.</span>',
    '<span style="white-space:nowrap"><span class="acid jit">日本一</span><span class="jit">ピースな</span></span><br/><span style="white-space:nowrap"><span class="blood jit">CBD</span><span class="jit">ショップ</span></span>',
    '<span class="jit">NIIGATA</span><br/><span class="acid jit">COOL</span><br/><span class="blood jit">CHILL</span>',
    '<span class="jit">STAY</span> <span class="acid jit">PEACE</span><br/><span class="jit">STAY</span> <span class="blood jit">HIGH</span>',
    '<span class="acid jit">EST.</span> <span class="blood jit">2023</span><br/><span class="jit">NEO+AID</span>'
  ];
  let idx = 0;
  function flip(){
    h1.classList.remove('whip-in');
    void h1.offsetWidth;
    h1.classList.add('whip-out');
    setTimeout(() => {
      idx = (idx + 1) % CHANNELS.length;
      h1.innerHTML = CHANNELS[idx];
      h1.classList.remove('whip-out');
      void h1.offsetWidth;
      h1.classList.add('whip-in');
    }, 320);
  }
  function schedule(){
    const t = 4000 + Math.random() * 2500;
    setTimeout(() => { flip(); schedule(); }, t);
  }
  schedule();
})();

/* ============================================================
   HERO VIDEO SLIDESHOW (up to 6 ch)

   Visual: two <video> layers (hv-a active, hv-b incoming).
           Circular clip-path wipe + class-swap at end (no head stutter).
           Both <video>s are kept MUTED forever — they're visual only.

   Audio:  two <audio> elements created in JS, each holds the audio
           track for the active or incoming clip. Crossfade their
           .volume across the wipe. <audio> elements aren't subject
           to the strict per-video autoplay policy that broke earlier
           attempts — once the user gesture from the intro gate plays
           them once, they remain audio-unlocked for the session.
   ============================================================ */
(() => {
  const heroVideoEl = document.querySelector('.hero-video');
  const vidA = document.getElementById('ytFrame');
  const vidB = document.querySelector('.hero-video .hv-b');
  const gate = document.getElementById('gate');
  const vinyl = document.getElementById('vinyl');
  const tonearm = document.getElementById('tonearm');
  const btnPlay = document.getElementById('btnPlay');
  const btnStop = document.getElementById('btnStop');
  const btnPrev = document.getElementById('hvPrev');
  const btnNext = document.getElementById('hvNext');
  const vol = document.getElementById('vol');
  const now = document.getElementById('now');
  const nowText = document.getElementById('nowText');

  const PLAYLIST = (window.NEO_VIDEOS && window.NEO_VIDEOS.length) ? window.NEO_VIDEOS : [];
  const WIPE_MS = 1400;
  const FADE_MS = 1000;

  // Lock the video elements to muted — they're visual only
  if(vidA){ vidA.muted = true; vidA.volume = 0; }
  if(vidB){ vidB.muted = true; vidB.volume = 0; }

  // Two audio elements (one per layer) — created in JS to avoid touching the template
  const audA = new Audio();
  const audB = new Audio();
  audA.preload = 'auto'; audB.preload = 'auto';
  audA.muted = true;     audB.muted = true;
  audA.volume = 0;       audB.volume = 0;
  audA.loop = false;     audB.loop = false;
  audA.style.display = 'none'; audB.style.display = 'none';
  document.body.appendChild(audA);
  document.body.appendChild(audB);

  // ---- Audio-feel visualizer ----
  // captureStream() + AnalyserNode is unreliable for cross-origin (Shopify
  // Files CDN) audio without consistent CORS. We use a procedural noise
  // generator that's strongly audible-looking while audio is playing, and
  // gate it on isPlaying so it stops the moment audio stops.
  const heroHead = document.getElementById('heroHead');
  function armVisualizer(){ /* no-op for procedural path */ }

  function visualizerLoop(){
    requestAnimationFrame(visualizerLoop);
    if(!heroHead) return;
    const inWhip = heroHead.classList.contains('whip-in') || heroHead.classList.contains('whip-out');
    if(!isPlaying || isDragging){
      if(!inWhip){
        heroHead.style.transform = '';
        heroHead.style.filter = '';
      }
      heroHead.querySelectorAll('.jit').forEach(n => { n.style.transform = ''; n.style.filter = ''; });
      return;
    }
    const t = performance.now() / 1000;
    const beat = Math.abs(Math.sin(t * 2.4) + 0.6 * Math.sin(t * 5.1)) / 1.6;
    const spike = Math.random() < 0.12 ? Math.random() : 0;
    const intensity = Math.min(1, beat * 0.7 + spike * 0.8);

    // small global tremor on h1
    if(!inWhip){
      const gx = (Math.random() - 0.5) * intensity * 6;
      const gy = (Math.random() - 0.5) * intensity * 2;
      heroHead.style.transform = `translate3d(${gx}px, ${gy}px, 0)`;
      heroHead.style.filter = '';
    }

    // per-word jitter — every .jit gets its own random offset
    heroHead.querySelectorAll('.jit').forEach(n => {
      const lx = (Math.random() - 0.5) * intensity * 22;
      const ly = (Math.random() - 0.5) * intensity * 5;
      const lb = intensity * 0.7 * Math.random();
      n.style.transform = `translate3d(${lx}px, ${ly}px, 0)`;
      n.style.filter = `blur(${lb}px)`;
    });
  }
  requestAnimationFrame(visualizerLoop);

  // ---- SCRATCH SYNTHESIZER (Web Audio, separate from playback) ----
  // Generates DJ-style scratch noise bursts driven by drag speed.
  let scratchCtx = null;
  let scratchNoiseBuf = null;
  function ensureScratchCtx(){
    if(scratchCtx) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if(!AC) return;
      scratchCtx = new AC();
      const N = Math.floor(scratchCtx.sampleRate * 0.5); // 0.5s noise pool
      scratchNoiseBuf = scratchCtx.createBuffer(1, N, scratchCtx.sampleRate);
      const d = scratchNoiseBuf.getChannelData(0);
      for(let i = 0; i < N; i++) d[i] = (Math.random() * 2 - 1) * 0.85;
    } catch(e){ scratchCtx = null; }
  }
  function playScratchTick(speed, direction){
    if(!scratchCtx || !scratchNoiseBuf) return;
    if(scratchCtx.state === 'suspended') scratchCtx.resume().catch(()=>{});
    // map drag speed → filter freq + playback rate
    const sp = Math.min(40, Math.max(1, speed));
    const cf = 600 + sp * 220;                  // bandpass center
    const rate = 0.6 + Math.min(2.5, sp * 0.06);
    const dur = 0.10 + Math.random() * 0.05;
    const now = scratchCtx.currentTime;
    const src = scratchCtx.createBufferSource();
    src.buffer = scratchNoiseBuf;
    src.playbackRate.value = direction >= 0 ? rate : rate * 0.85;
    const bp = scratchCtx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = cf;
    bp.Q.value = 5;
    const hp = scratchCtx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 200;
    const g = scratchCtx.createGain();
    const vol = Math.min(0.7, sp * 0.04) * userVolume * 1.2;
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(vol, now + 0.005);
    g.gain.linearRampToValueAtTime(0, now + dur);
    const offset = Math.random() * (scratchNoiseBuf.duration - dur - 0.01);
    src.connect(bp).connect(hp).connect(g).connect(scratchCtx.destination);
    src.start(now, offset);
    src.stop(now + dur + 0.02);
  }

  // active vs incoming references — swapped each wipe
  let activeVid = vidA, incomingVid = vidB;
  let activeAud = audA, incomingAud = audB;

  // ---- Shuffle bag + session history ----
  let shuffleQueue = [];
  function refillShuffle(avoid){
    shuffleQueue = [...PLAYLIST].sort(() => Math.random() - 0.5);
    if(avoid && shuffleQueue[0] === avoid && shuffleQueue.length > 1){
      [shuffleQueue[0], shuffleQueue[1]] = [shuffleQueue[1], shuffleQueue[0]];
    }
  }
  function takeFromShuffle(avoid){
    if(!PLAYLIST.length) return '';
    if(shuffleQueue.length === 0) refillShuffle(avoid);
    return shuffleQueue.shift();
  }
  const history = [];
  let historyIdx = -1;
  function getForwardUrl(){
    if(historyIdx < history.length - 1) return history[historyIdx + 1];
    const url = takeFromShuffle(historyIdx >= 0 ? history[historyIdx] : null);
    history.push(url);
    return url;
  }
  function getBackwardUrl(){
    if(historyIdx <= 0) return null;
    return history[historyIdx - 1];
  }

  function labelOf(url){
    try { return decodeURIComponent(url.split('/').pop().split('?')[0].replace(/\.(mp4|webm|mov)$/i,'')); }
    catch(e){ return 'TRACK'; }
  }
  function setNowLabel(url){
    if(nowText) nowText.textContent = 'NOW SPINNING · ' + labelOf(url);
  }
  function updateNavButtons(){
    if(btnPrev) btnPrev.disabled = !(historyIdx > 0);
    if(btnNext) btnNext.disabled = !(PLAYLIST.length > 1);
  }

  let isPlaying = false;
  let isDragging = false;
  let wipeInFlight = false;
  let userVolume = vol ? parseFloat(vol.value) : 0.7;

  // ---- Audio sync helper: keep audio in step with the visible video ----
  function syncAudioTo(aud, vid){
    if(!aud || !vid) return;
    try {
      if(Math.abs((aud.currentTime || 0) - (vid.currentTime || 0)) > 0.15){
        aud.currentTime = vid.currentTime;
      }
    } catch(e){}
  }

  // ---- 'ended' on either video triggers auto-advance ----
  function onEnded(ev){
    if(ev.target !== activeVid) return;
    if(!isPlaying) return;
    goTo(1);
  }
  if(vidA) vidA.addEventListener('ended', onEnded);
  if(vidB) vidB.addEventListener('ended', onEnded);

  // ---- Boot: load first URL ----
  if(vidA && PLAYLIST.length){
    const first = takeFromShuffle();
    history.push(first); historyIdx = 0;

    vidA.src = first;
    vidA.loop = false;
    vidA.play().catch(()=>{});
    vidA.addEventListener('loadeddata', () => {
      if(heroVideoEl) heroVideoEl.classList.add('yt-on');
    }, { once:true });
    vidA.addEventListener('error', () => {
      if(heroVideoEl) heroVideoEl.classList.add('yt-fail');
    });

    audA.src = first;
    audA.load();

    setNowLabel(first);

    if(vidB && PLAYLIST.length > 1){
      const nextUrl = takeFromShuffle(first);
      history.push(nextUrl);
      vidB.src = nextUrl;
      vidB.loop = false;
      vidB.load();
      vidB.dataset.url = nextUrl;
      audB.src = nextUrl;
      audB.load();
      audB.dataset.url = nextUrl;
    }
  } else if(heroVideoEl){
    heroVideoEl.classList.add('yt-fail');
  }
  updateNavButtons();

  // ---- Simple volume ramp on an audio element ----
  function rampVolume(aud, fromV, toV, durMs){
    if(!aud) return;
    const t0 = performance.now();
    function step(){
      const p = Math.min(1, (performance.now() - t0) / durMs);
      try { aud.volume = fromV + (toV - fromV) * p; } catch(e){}
      if(p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // ---- Seamless wipe-and-swap ----
  function doWipeTo(targetUrl){
    if(!activeVid || !incomingVid || !targetUrl){ wipeInFlight = false; return; }

    // Make sure incoming holds targetUrl on BOTH the video and audio sides.
    if(incomingVid.dataset.url !== targetUrl){
      incomingVid.src = targetUrl;
      incomingVid.dataset.url = targetUrl;
      try { incomingVid.load(); } catch(e){}
    }
    if(incomingAud.dataset.url !== targetUrl){
      incomingAud.src = targetUrl;
      incomingAud.dataset.url = targetUrl;
      try { incomingAud.load(); } catch(e){}
    }
    try { incomingVid.currentTime = 0; } catch(e){}
    try { incomingAud.currentTime = 0; } catch(e){}

    const startWipe = () => {
      // start incoming video (muted, visual only) and audio (volume 0 → ramp up)
      incomingVid.play().catch(()=>{});
      incomingAud.muted = false;
      incomingAud.volume = 0;
      incomingAud.play().catch(()=>{});

      requestAnimationFrame(() => { heroVideoEl.classList.add('wipe-in'); });

      // crossfade audio: active down, incoming up
      if(isPlaying){
        rampVolume(activeAud, activeAud.volume, 0, FADE_MS);
        rampVolume(incomingAud, 0, userVolume, FADE_MS);
      }

      setTimeout(() => {
        const oldActiveVid = activeVid;
        const newActiveVid = incomingVid;
        const oldActiveAud = activeAud;
        const newActiveAud = incomingAud;

        // visual class swap (no animation, snaps cleanly)
        heroVideoEl.classList.add('no-anim');
        oldActiveVid.classList.remove('hv-a'); oldActiveVid.classList.add('hv-b');
        newActiveVid.classList.remove('hv-b'); newActiveVid.classList.add('hv-a');
        heroVideoEl.classList.remove('wipe-in');
        void heroVideoEl.offsetWidth;
        heroVideoEl.classList.remove('no-anim');

        // swap references
        activeVid = newActiveVid;
        incomingVid = oldActiveVid;
        activeAud = newActiveAud;
        incomingAud = oldActiveAud;

        // pin the audio levels in case the ramp drifted
        try { activeAud.volume = userVolume; } catch(e){}
        try { incomingAud.volume = 0; } catch(e){}

        // park old (now incoming)
        incomingVid.pause();
        try { incomingAud.pause(); } catch(e){}

        // ensure new active video & audio are running
        if(isPlaying){
          if(activeVid.paused) activeVid.play().catch(()=>{});
          if(activeAud.paused) activeAud.play().catch(()=>{});
        }
        // align audio to video
        syncAudioTo(activeAud, activeVid);

        setNowLabel(targetUrl);

        // preload the NEXT forward url into incoming (both layers)
        if(PLAYLIST.length > 1){
          let upcoming;
          if(historyIdx < history.length - 1){
            upcoming = history[historyIdx + 1];
          } else {
            upcoming = takeFromShuffle(targetUrl);
            history.push(upcoming);
          }
          if(incomingVid.dataset.url !== upcoming){
            incomingVid.src = upcoming;
            incomingVid.dataset.url = upcoming;
            incomingVid.load();
          }
          if(incomingAud.dataset.url !== upcoming){
            incomingAud.src = upcoming;
            incomingAud.dataset.url = upcoming;
            incomingAud.load();
          }
        }

        wipeInFlight = false;
        updateNavButtons();
      }, WIPE_MS);
    };

    if(incomingVid.readyState >= 2) startWipe();
    else {
      const once = () => { incomingVid.removeEventListener('canplay', once); startWipe(); };
      incomingVid.addEventListener('canplay', once);
      setTimeout(once, 1500);
    }
  }

  function goTo(direction){
    if(wipeInFlight || isDragging || PLAYLIST.length < 2) return;
    let target;
    if(direction === 1){
      target = getForwardUrl();
      historyIdx++;
    } else {
      target = getBackwardUrl();
      if(!target) return;
      historyIdx--;
    }
    wipeInFlight = true;
    doWipeTo(target);
  }

  // ---- Intro gate ----
  if(gate){
    gate.addEventListener('click', async () => {
      gate.classList.add('dropping');
      const ring = document.createElement('div'); ring.className = 'needle-ring'; document.body.appendChild(ring);
      const flash = document.createElement('div'); flash.className = 'needle-flash'; document.body.appendChild(flash);
      requestAnimationFrame(() => { ring.classList.add('bang'); flash.classList.add('bang'); });
      const status = document.createElement('div'); status.className = 'gate-status';
      status.textContent = '▼ DROPPING THE NEEDLE'; document.body.appendChild(status);
      setTimeout(() => status.classList.add('show'), 260);
      const curtain = document.createElement('div'); curtain.className = 'needle-curtain';
      curtain.innerHTML = '<b></b><b></b><b></b><b></b><b></b><b></b><b></b><b></b>';
      document.body.appendChild(curtain);
      setTimeout(() => curtain.classList.add('lift'), 720);

      // Kick everything off SYNCHRONOUSLY inside the user gesture so both
      // audio elements get their first authorized play() call.
      const playPromises = [];
      if(activeVid){ playPromises.push(activeVid.play().catch(()=>{})); }
      if(activeAud){
        activeAud.muted = false;
        activeAud.volume = userVolume;
        playPromises.push(activeAud.play().catch(()=>{}));
      }
      if(incomingAud){
        incomingAud.muted = false;
        incomingAud.volume = 0;
        // prime the second audio element with a play() inside the gesture
        playPromises.push(incomingAud.play().catch(()=>{}));
      }
      try { await Promise.all(playPromises); } catch(e){}
      // park incoming after the prime; it's now audio-unlocked
      if(incomingAud){
        try { incomingAud.pause(); } catch(e){}
        try { incomingAud.currentTime = 0; } catch(e){}
      }
      // align audio to video for active
      syncAudioTo(activeAud, activeVid);

      // build analyser graph now that audio is actually playing
      armVisualizer();

      isPlaying = true;
      if(btnPlay) btnPlay.textContent = '❚❚';
      if(vinyl) vinyl.classList.remove('paused');
      if(tonearm) tonearm.classList.add('down');
      if(now){ now.classList.add('show'); now.classList.remove('paused'); }
      updateNavButtons();

      setTimeout(() => {
        try{ gate.remove(); }catch(e){}
        try{ flash.remove(); }catch(e){}
        try{ ring.remove(); }catch(e){}
        try{ status.remove(); }catch(e){}
        try{ curtain.remove(); }catch(e){}
      }, 2000);
    }, { once:true });
  }

  // ---- Play / Pause / Stop / Volume / Prev / Next ----
  if(btnPlay) btnPlay.addEventListener('click', () => {
    if(!activeVid) return;
    if(isPlaying){
      activeVid.pause();
      try { activeAud.pause(); } catch(e){}
      isPlaying = false;
      btnPlay.textContent = '▶';
      if(vinyl) vinyl.classList.add('paused');
      if(tonearm) tonearm.classList.remove('down');
      if(now) now.classList.add('paused');
    } else {
      activeVid.play().catch(()=>{});
      try { activeAud.muted = false; activeAud.volume = userVolume; activeAud.play(); } catch(e){}
      syncAudioTo(activeAud, activeVid);
      isPlaying = true;
      btnPlay.textContent = '❚❚';
      if(vinyl) vinyl.classList.remove('paused');
      if(tonearm) tonearm.classList.add('down');
      if(now){ now.classList.add('show'); now.classList.remove('paused'); }
    }
  });
  if(btnStop) btnStop.addEventListener('click', () => {
    if(!activeVid) return;
    activeVid.pause();
    try { activeVid.currentTime = 0; } catch(e){}
    try { activeAud.pause(); activeAud.currentTime = 0; } catch(e){}
    isPlaying = false;
    if(btnPlay) btnPlay.textContent = '▶';
    if(vinyl) vinyl.classList.add('paused');
    if(tonearm) tonearm.classList.remove('down');
    if(now) now.classList.add('paused');
  });
  if(vol) vol.addEventListener('input', () => {
    userVolume = parseFloat(vol.value);
    try { activeAud.volume = userVolume; } catch(e){}
  });
  if(btnPrev) btnPrev.addEventListener('click', () => goTo(-1));
  if(btnNext) btnNext.addEventListener('click', () => goTo(1));

  // ---- Vinyl spin (visual) ----
  let rotation = 0, lastFrame = performance.now();
  if(vinyl){
    vinyl.style.animation = 'none';
    function spinLoop(now2){
      const dt = (now2 - lastFrame) / 1000;
      lastFrame = now2;
      if(isPlaying && !isDragging){
        rotation += 360 / 1.8 * dt;
      }
      vinyl.style.transform = `rotate(${rotation}deg)`;
      requestAnimationFrame(spinLoop);
    }
    requestAnimationFrame((t)=>{ lastFrame = t; spinLoop(t); });
  }

  // (Removed periodic resync — it was rewinding audio when it crept ahead
  //  of the video, causing the "same section keeps replaying" loop bug.)

  // ---- Scratch: drag scrubs video + plays synthesized scratch sound ----
  let lastX = 0, lastY = 0, lastTs = 0;
  const SEC_PER_PX = 1 / 120;
  const DEG_PER_PX = 270 / 200;
  let scratchTickAccum = 0;

  function pointerXY(e){
    if(e.touches && e.touches[0]) return [e.touches[0].clientX, e.touches[0].clientY];
    return [e.clientX, e.clientY];
  }

  function onDown(e){
    if(!activeVid) return;
    e.preventDefault();
    ensureScratchCtx();
    isDragging = true;
    if(vinyl) vinyl.classList.add('dragging');
    // pause music — scratch sound takes over the audio channel
    try { activeVid.pause(); } catch(err){}
    try { activeAud.pause(); } catch(err){}
    const [x, y] = pointerXY(e);
    lastX = x; lastY = y;
    lastTs = performance.now();
    scratchTickAccum = 0;
  }
  function onMove(e){
    if(!isDragging || !activeVid) return;
    e.preventDefault();
    const [x, y] = pointerXY(e);
    const ts = performance.now();
    const dx = x - lastX, dy = y - lastY;
    const signed = dx + dy;
    const dt = Math.max(1, ts - lastTs);
    if(Math.abs(signed) < 0.5){ lastX = x; lastY = y; lastTs = ts; return; }

    // scrub video time
    const d = activeVid.duration || 0;
    if(d > 0){
      let t = (activeVid.currentTime || 0) + signed * SEC_PER_PX;
      t = ((t % d) + d) % d;
      try { activeVid.currentTime = t; } catch(err){}
      try { activeAud.currentTime = t; } catch(err){}
    }
    rotation += signed * DEG_PER_PX;

    // emit a scratch-sound tick — limit to a manageable rate so we don't
    // stack hundreds of bursts per second
    const speed = Math.abs(signed) / dt * 16; // px/ms → arbitrary
    scratchTickAccum += dt;
    if(scratchTickAccum > 35){
      scratchTickAccum = 0;
      playScratchTick(speed, signed >= 0 ? 1 : -1);
    }

    lastX = x; lastY = y; lastTs = ts;
  }
  function onUp(){
    if(!isDragging) return;
    isDragging = false;
    if(vinyl) vinyl.classList.remove('dragging');
    // resume music from the scrubbed position
    if(activeVid && isPlaying){
      activeVid.play().catch(()=>{});
      try { activeAud.play(); } catch(e){}
      syncAudioTo(activeAud, activeVid);
    }
  }

  if(vinyl){
    vinyl.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    vinyl.addEventListener('touchstart', onDown, { passive:false });
    window.addEventListener('touchmove', onMove, { passive:false });
    window.addEventListener('touchend', onUp);
  }
})();
