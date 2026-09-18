"use strict";
(() => {
  const root = document.documentElement;
  const opening = document.getElementById("opening");
  const motionButton = document.getElementById("motion-toggle");
  const replayButton = document.getElementById("replay-intro");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  const reveals = [...document.querySelectorAll("[data-reveal]")];
  const localized = [...document.querySelectorAll("[data-i18n]")];
  const originalText = new Map(localized.map(node => [node, node.textContent]));
  const en = {
    skip: "Skip to the invitation", honour: "A PERSONAL INVITATION, JUST FOR YOU", celebrating: "CELEBRATING",
    heroLine: "A little mystery. A night to remember.", discover: "Discover the invitation", scroll: "SCROLL TO DISCOVER",
    dearYou: "DEAR YOU", inviteTitle1: "A new chapter.", inviteTitle2: "An evening to call ours.",
    inviteText: "Some moments only feel complete with the people we cherish. I would love to raise a glass with you, share a few smiles, and welcome a beautiful new chapter together.",
    inviteText2: "Save this evening for me, won't you?", withLove: "With love,", eveningTitle: "It's a date.",
    eveningSub: "Make room for a special evening.", september: "SEPTEMBER", timeLabel: "WHEN", vietnamTime: "· Vietnam time",
    fullDate: "Saturday, 26 September 2026", venueLabel: "WHERE", venue: "Yoyo Central Ho Con Rua - Beer Garden",
    venueNote: "No. 1 Cong Truong Quoc Te, Xuan Hoa Ward, HCMC", dresscodeLabel: "DRESSCODE", dresscode: "Costume / Cosplay", dresscodeNote: "Dress as your favorite character (Anime, European, Royal...)", saveDate: "Add to your calendar", openMap: "Open in Maps", calendarNote: "Let's not miss this moment.",
    countdownTitle: "UNTIL WE RAISE OUR GLASSES", days: "DAYS", hours: "HOURS", minutes: "MINS", seconds: "SECS",
    bestGift: "THE MOST BEAUTIFUL PART OF THE EVENING", closing1: "The most beautiful gift",
    closing2: "is having you here.", closingText: "Let's make another beautiful memory together.", replay: "Open the invitation again",
    openingEyebrow: "A SPECIAL INVITATION IS WAITING FOR YOU", open: "Open your invitation", skipOpening: "Skip the animation"
  };
  let language = "vi", userPaused = false, introTimer = 0, toastTimer = 0, openingInProgress = false, observer;
  const preference = (key, fallback) => { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } };
  const remember = (key, value) => { try { localStorage.setItem(key, value); } catch {} };
  language = preference("koko-language", "vi") === "en" ? "en" : "vi";
  userPaused = preference("koko-motion-paused", "false") === "true";
  const canMove = () => !userPaused && !reducedMotion.matches;
  const say = (vi, english) => language === "en" ? english : vi;

  function syncLanguage(nextLanguage) {
    language = nextLanguage;
    root.lang = language;
    localized.forEach(node => { node.textContent = language === "en" ? (en[node.dataset.i18n] ?? originalText.get(node)) : originalText.get(node); });
    document.querySelectorAll("[data-lang]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.lang === language)));
    document.querySelector('meta[name="description"]').content = say(
      "Một lời mời dành riêng cho bạn. Mừng sinh nhật Koko Linh lúc 19h00, thứ Bảy, 26.09.2026. Địa điểm sẽ được công bố sau.",
      "A personal invitation to Koko Linh's birthday. Saturday, 26 September 2026 at 7 PM, Vietnam time. Venue to be announced."
    );
    document.querySelector(".page-footer .wordmark").setAttribute("aria-label", say("Về đầu trang", "Back to the top"));
    document.getElementById("countdown").setAttribute("aria-label", say("Đếm ngược đến sinh nhật", "Countdown to the birthday celebration"));
    document.getElementById("toast").hidden = true;
    remember("koko-language", language);
    syncMotion();
    updateCountdown();
  }
  document.querySelectorAll("[data-lang]").forEach(button => button.addEventListener("click", () => syncLanguage(button.dataset.lang)));

  function showContent() {
    root.classList.add("invitation-open");
    observer?.disconnect();
    if (!canMove() || !("IntersectionObserver" in window)) {
      reveals.forEach(node => node.classList.add("is-visible"));
      return;
    }
    root.classList.add("motion-ready");
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    reveals.forEach(node => observer.observe(node));
  }
  document.querySelectorAll(".hero-copy [data-reveal]").forEach((node, index) => node.style.setProperty("--delay", `${index * 85}ms`));

  function finishOpening() {
    clearTimeout(introTimer);
    openingInProgress = false;
    if (opening?.open) opening.close();
    opening?.classList.remove("is-opening");
    document.body.classList.remove("intro-active");
    showContent();
    document.getElementById("hero-title").focus({ preventScroll: true });
    syncAnimation();
  }
  function openInvitation(skip = false) {
    if (openingInProgress && !skip) return;
    if (skip || !canMove() || !opening?.open) return finishOpening();
    openingInProgress = true;
    opening.classList.add("is-opening");
    showContent();
    introTimer = setTimeout(finishOpening, 1320);
  }
  function showOpening() {
    if (typeof opening?.showModal !== "function") return showContent();
    clearTimeout(introTimer);
    openingInProgress = false;
    opening.classList.remove("is-opening");
    root.classList.remove("invitation-open");
    observer?.disconnect();
    reveals.forEach(node => node.classList.remove("is-visible"));
    window.scrollTo({ top: 0, behavior: "instant" });
    try {
      opening.showModal();
      document.body.classList.add("intro-active");
      document.getElementById("open-invitation").focus();
    } catch { showContent(); }
    syncAnimation();
  }
  document.getElementById("open-invitation").addEventListener("click", () => openInvitation());
  document.getElementById("skip-opening").addEventListener("click", () => openInvitation(true));
  replayButton.addEventListener("click", showOpening);
  opening?.addEventListener("cancel", event => { event.preventDefault(); openInvitation(true); });
  opening?.addEventListener("close", () => {
    document.body.classList.remove("intro-active");
    if (!root.classList.contains("invitation-open")) showContent();
    syncAnimation();
  });

  function syncMotion() {
    root.dataset.motion = canMove() ? "on" : "off";
    motionButton.setAttribute("aria-pressed", String(!canMove()));
    motionButton.setAttribute("aria-label", reducedMotion.matches
      ? say("Thiết bị đang bật chế độ giảm chuyển động", "Your device prefers reduced motion")
      : canMove() ? say("Tạm dừng hiệu ứng", "Pause animations") : say("Bật hiệu ứng", "Enable animations"));
    motionButton.disabled = reducedMotion.matches;
    if (!canMove()) {
      observer?.disconnect();
      reveals.forEach(node => node.classList.add("is-visible"));
      if (openingInProgress) finishOpening();
    }
    syncAnimation();
  }
  motionButton.addEventListener("click", () => {
    userPaused = !userPaused;
    remember("koko-motion-paused", String(userPaused));
    syncMotion();
  });
  reducedMotion.addEventListener("change", syncMotion);

  // The invitation's single confirmed start instant: 19:00 in Vietnam (UTC+7).
  const eventTime = Date.parse("2026-09-26T19:00:00+07:00");
  const dayAfter = Date.parse("2026-09-27T00:00:00+07:00");
  const countdownIds = ["days", "hours", "minutes", "seconds"];
  function updateCountdown() {
    const now = Date.now();
    let total = Math.max(0, Math.floor((eventTime - now) / 1000));
    const values = [Math.floor(total / 86400), Math.floor(total / 3600) % 24, Math.floor(total / 60) % 60, total % 60];
    countdownIds.forEach((id, index) => { document.getElementById(id).textContent = String(values[index]).padStart(2, "0"); });
    const isStarted = now >= eventTime;
    document.getElementById("countdown").hidden = isStarted;
    const ended = document.getElementById("countdown-ended");
    ended.hidden = !isStarted;
    if (isStarted) {
      document.getElementById("countdown-label").textContent = "26.09.2026 — KOKO LINH";
      ended.textContent = now < dayAfter ? say("Đêm đặc biệt đã bắt đầu.", "Our special evening has begun.") : say("Một dấu mốc thật đẹp.", "A beautiful chapter to remember.");
    }
  }
  setInterval(() => { if (!document.hidden) updateCountdown(); }, 1000);
  document.querySelectorAll('a[href="koko-linh-birthday.ics"]').forEach(link => link.addEventListener("click", (e) => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (!isIOS) {
        e.preventDefault(); // Prevent downloading the file
        const googleCalendarUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Koko+Linh%27s+Birthday+-+The+Ruby+Soir%C3%A9e&dates=20260926T110000Z/20260926T150000Z&details=Time:+18:00+(Vietnam+Time)%0ATheme:+Scarlet+Noir%0ADress+Code:+Costume+(Anime,+European,+Royal...)%0AVenue:+Yoyo+Central+Ho+Con+Rua,+No.+1+Cong+Truong+Quoc+Te,+HCMC&location=Yoyo+Central+Ho+Con+Rua,+No.+1+Cong+Truong+Quoc+Te,+HCMC';
        window.open(googleCalendarUrl, '_blank');
    } else {
        const toast = document.getElementById("toast");
        clearTimeout(toastTimer);
        toast.textContent = say("H? th?ng dang m? l?ch c?a b?n d? luu cu?c h?n. �?a di?m s? du?c c?p nh?t sau.", "Opening your calendar to save the date. The venue will be shared later.");
        toast.hidden = false;
        toastTimer = setTimeout(() => { toast.hidden = true; }, 6000);
    }
  }));
  document.addEventListener("keydown", event => { if (event.key === "Escape") document.getElementById("toast").hidden = true; });

  // One animation loop, capped at 30 fps; it stops for hidden tabs and reduced motion.
  const canvas = document.getElementById("stardust");
  const context = canvas.getContext("2d");
  const layers = [...document.querySelectorAll("[data-depth]")];
  const hero = document.getElementById("home");
  let width = 0, height = 0, animationFrame = 0, lastFrame = 0;
  let pointerX = 0, pointerY = 0, smoothX = 0, smoothY = 0;

  let lastScrollYPos = window.scrollY;
  let scrollVelocity = 0;

  class SilkWave {
      constructor(color, amplitude, frequency, speed, yOffset) {
          this.color = color; this.amplitude = amplitude; this.frequency = frequency;
          this.speed = speed; this.originalYOffset = yOffset; this.yOffset = yOffset; 
          this.step = 0; this.points = [];
      }
      draw(ctx, w, h) {
          ctx.beginPath(); ctx.moveTo(0, h); this.points = [];
          for (let x = 0; x <= w; x += 10) {
              let y = Math.sin(x * this.frequency + this.step) * this.amplitude + 
                      Math.cos(x * (this.frequency * 0.6) + this.step * 0.4) * (this.amplitude * 0.6) + 
                      (h * this.yOffset);
              ctx.lineTo(x, y);
              if (x % 40 === 0) this.points.push({x, y});
          }
          ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
          ctx.fillStyle = this.color; ctx.fill();
          this.step += this.speed; 
      }
  }
  class Sparkle {
      constructor(x, y) {
          this.x = x; this.y = y; this.size = Math.random() * 2.5 + 0.5;
          this.speedX = (Math.random() - 0.5) * 0.5; this.speedY = -Math.random() * 0.8 - 0.2;
          this.alpha = 1; this.decay = Math.random() * 0.008 + 0.003;
          const goldTones = ['rgba(212,175,55,', 'rgba(255,215,0,', 'rgba(244,196,48,'];
          this.colorBase = goldTones[Math.floor(Math.random() * goldTones.length)];
      }
      update() { this.x += this.speedX; this.y += this.speedY; this.alpha -= this.decay; }
      draw(ctx) {
          ctx.save(); ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.shadowBlur = this.size * 3; ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
          ctx.fillStyle = this.colorBase + this.alpha + ')'; ctx.fill(); ctx.restore();
      }
  }
  let waves = [], sparkles = [];

  function resizeCanvas() {
    width = window.innerWidth; height = window.innerHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    context?.setTransform(ratio, 0, 0, ratio, 0, 0);
    waves = [
        new SilkWave('rgba(114, 14, 38, 0.12)', 140, 0.002, 0.004, 0.4),
        new SilkWave('rgba(166, 25, 46, 0.08)', 180, 0.0015, 0.003, 0.48),
        new SilkWave('rgba(212, 175, 55, 0.03)', 100, 0.003, 0.005, 0.55),
        new SilkWave('rgba(141, 18, 36, 0.09)', 160, 0.001, 0.002, 0.43)
    ];
    updateProgress();
  }
  hero.addEventListener("pointermove", event => {
    if (!finePointer.matches || !canMove()) return;
    const box = hero.getBoundingClientRect();
    pointerX = (event.clientX - box.left) / box.width - .5;
    pointerY = (event.clientY - box.top) / box.height - .5;
  }, { passive: true });
  hero.addEventListener("pointerleave", () => { pointerX = 0; pointerY = 0; });
  
  function animate(timestamp) {
    animationFrame = requestAnimationFrame(animate);
    if (timestamp - lastFrame < 32) return;
    const elapsed = Math.min(2, (timestamp - lastFrame) / 33.33 || 1);
    lastFrame = timestamp;
    
    // Smooth scroll velocity decay
    scrollVelocity *= 0.9;

    if (context) {
      context.clearRect(0, 0, width, height);
      waves.forEach(wave => {
          // React to scroll: waves shift vertically
          wave.yOffset -= scrollVelocity * 0.0005;
          // Spring back to original position smoothly
          wave.yOffset += (wave.originalYOffset - wave.yOffset) * 0.05;
          
          wave.draw(context, width, height);
          
          // Spawn extra sparkles if scrolling fast!
          let isScrollingFast = Math.abs(scrollVelocity) > 10;
          let spawnChance = isScrollingFast ? 0.4 : 0.15;
          
          if (Math.random() < spawnChance && wave.points.length > 0) {
              let pt = wave.points[Math.floor(Math.random() * wave.points.length)];
              let sparkle = new Sparkle(pt.x, pt.y);
              if (isScrollingFast) {
                  // Sparkles get thrown up/down by the scroll force
                  sparkle.speedY -= scrollVelocity * 0.05;
                  sparkle.speedX += (Math.random() - 0.5) * (Math.abs(scrollVelocity) * 0.05);
                  sparkle.decay = Math.random() * 0.015 + 0.005; // Fade a bit faster if thrown
              }
              sparkles.push(sparkle);
          }
      });
      for (let i = sparkles.length - 1; i >= 0; i--) {
          sparkles[i].update(); sparkles[i].draw(context);
          if (sparkles[i].alpha <= 0 || sparkles[i].y < -50 || sparkles[i].y > height + 50) sparkles.splice(i, 1);
      }
    }
    if (finePointer.matches) {
      smoothX += (pointerX - smoothX) * .07;
      smoothY += (pointerY - smoothY) * .07;
      const scrollDrift = Math.min(window.scrollY / height, 1.3);
      layers.forEach(layer => {
        const depth = Number(layer.dataset.depth);
        layer.style.setProperty("--px", `${(smoothX * depth).toFixed(2)}px`);
        layer.style.setProperty("--py", `${(smoothY * depth - scrollDrift * depth * .65).toFixed(2)}px`);
      });
    }
  }  function syncAnimation() {
    // Called after all animation state is initialized below.
    if (typeof animationFrame === "undefined") return;
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    lastFrame = 0;
    if (canMove() && !document.hidden && !opening?.open) animationFrame = requestAnimationFrame(animate);
  }
  let progressFrame = 0;
  function updateProgress() {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const currentScrollY = window.scrollY;
    document.querySelector(".reading-progress").style.transform = `scaleX(${maxScroll > 0 ? Math.min(1, currentScrollY / maxScroll) : 0})`;
    scrollVelocity = currentScrollY - lastScrollYPos;
    lastScrollYPos = currentScrollY;
    progressFrame = 0;
  }
  addEventListener("scroll", () => { if (!progressFrame) progressFrame = requestAnimationFrame(updateProgress); }, { passive: true });
  addEventListener("resize", resizeCanvas, { passive: true });
  document.addEventListener("visibilitychange", () => { root.dataset.documentHidden = String(document.hidden); syncAnimation(); if (!document.hidden) updateCountdown(); });
  resizeCanvas();
  motionButton.hidden = false;
  replayButton.hidden = typeof opening?.showModal !== "function";
  syncLanguage(language);
  if (location.hash) showContent(); else showOpening();
})();








