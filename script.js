"use strict";
(() => {
  const root = document.documentElement;
  const opening = document.getElementById("opening");
  const openButton = document.getElementById("open-invitation");
  const skipButton = document.getElementById("skip-opening");
  const replayButton = document.getElementById("replay-intro");
  const motionButton = document.getElementById("motion-toggle");
  const notice = document.getElementById("calendar-notice");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const reveals = Array.from(document.querySelectorAll("[data-reveal]"));
  let userPaused = false;
  let observer;
  let introTimer;
  let noticeTimer;
  let openingInProgress = false;
  try { userPaused = localStorage.getItem("koko-motion-paused") === "true"; } catch (_) {}
  const motionAllowed = () => !reducedMotion.matches && !userPaused;

  function showContent() {
    root.classList.add("invitation-open");
    if (observer) observer.disconnect();
    if (!motionAllowed() || !("IntersectionObserver" in window)) {
      reveals.forEach((element) => element.classList.add("is-visible"));
      return;
    }
    root.classList.add("motion-ready");
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08 });
    reveals.forEach((element) => {
      const delay = Math.min(400, Math.max(0, Number(element.dataset.reveal) || 0));
      element.style.setProperty("--reveal-delay", `${delay}ms`);
      observer.observe(element);
    });
  }

  function finishOpening() {
    window.clearTimeout(introTimer);
    openingInProgress = false;
    if (opening && opening.open) opening.close();
    if (opening) opening.classList.remove("is-opening");
    document.body.classList.remove("intro-active");
    showContent();
    document.getElementById("invitation-title")?.focus({ preventScroll: true });
  }

  function openInvitation(skipAnimation = false) {
    if (openingInProgress && !skipAnimation) return;
    if (!opening?.open || skipAnimation || !motionAllowed()) {
      finishOpening();
      return;
    }
    openingInProgress = true;
    // Begin the content reveal under the panels, then release the native modal.
    showContent();
    opening.classList.add("is-opening");
    introTimer = window.setTimeout(finishOpening, 980);
  }

  function showOpening() {
    if (!opening || typeof opening.showModal !== "function") {
      showContent();
      return;
    }
    window.clearTimeout(introTimer);
    openingInProgress = false;
    opening.classList.remove("is-opening");
    root.classList.remove("invitation-open");
    if (observer) observer.disconnect();
    reveals.forEach((element) => element.classList.remove("is-visible"));
    window.scrollTo({ top: 0, behavior: "instant" });
    try {
      opening.showModal();
      document.body.classList.add("intro-active");
      if (motionAllowed()) root.classList.add("motion-ready");
    } catch (_) {
      document.body.classList.remove("intro-active");
      showContent();
    }
  }

  function syncMotion() {
    const allowed = motionAllowed();
    root.dataset.motion = allowed ? "on" : "off";
    if (motionButton) {
      motionButton.setAttribute("aria-pressed", String(!allowed));
      motionButton.setAttribute("aria-label", allowed ? "Tạm dừng hiệu ứng" : (reducedMotion.matches ? "Thiết bị đang bật chế độ giảm chuyển động" : "Bật hiệu ứng"));
      motionButton.disabled = reducedMotion.matches;
    }
    if (!allowed) {
      if (observer) observer.disconnect();
      reveals.forEach((element) => element.classList.add("is-visible"));
      if (openingInProgress) finishOpening();
    }
  }

  motionButton?.addEventListener("click", () => {
    if (reducedMotion.matches) return;
    userPaused = !userPaused;
    try { localStorage.setItem("koko-motion-paused", String(userPaused)); } catch (_) {}
    syncMotion();
  });
  openButton?.addEventListener("click", () => openInvitation(false));
  skipButton?.addEventListener("click", () => openInvitation(true));
  replayButton?.addEventListener("click", showOpening);
  opening?.addEventListener("cancel", (event) => {
    event.preventDefault();
    openInvitation(true);
  });
  opening?.addEventListener("close", () => {
    document.body.classList.remove("intro-active");
    if (!root.classList.contains("invitation-open")) showContent();
  });
  if (typeof reducedMotion.addEventListener === "function") reducedMotion.addEventListener("change", syncMotion);
  else if (typeof reducedMotion.addListener === "function") reducedMotion.addListener(syncMotion);
  document.addEventListener("visibilitychange", () => { root.dataset.documentHidden = String(document.hidden); });

  document.querySelectorAll('a[href="koko-linh-birthday.ics"]').forEach((link) => {
    link.addEventListener("click", () => {
      if (!notice) return;
      window.clearTimeout(noticeTimer);
      notice.hidden = false;
      noticeTimer = window.setTimeout(() => { notice.hidden = true; }, 6500);
    });
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && notice) notice.hidden = true;
  });
  syncMotion();
  if (motionButton) motionButton.hidden = false;
  if (replayButton && typeof opening?.showModal === "function") replayButton.hidden = false;
  if (window.location.hash) showContent();
  else showOpening();
})();
