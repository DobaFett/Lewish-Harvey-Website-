/* Lewis-Harvey Limited — site behaviour. Vanilla JS, no dependencies.
   Everything here is progressive enhancement: the site works without it. */
(function () {
  "use strict";

  var header = document.querySelector("[data-header]");

  /* Sticky header shadow */
  function onScroll() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 4);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Mobile menu */
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.getElementById("mobile-menu");
  function closeMenu() {
    if (!toggle || !menu) return;
    toggle.setAttribute("aria-expanded", "false");
    menu.hidden = true;
    document.documentElement.classList.remove("menu-open");
  }
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      menu.hidden = open;
      document.documentElement.classList.toggle("menu-open", !open);
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeMenu();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !menu.hidden) {
        closeMenu();
        toggle.focus();
      }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth >= 1024) closeMenu();
    });
  }

  /* Services dropdown — click (touch/keyboard) + hover (pointer), Esc closes */
  document.querySelectorAll("[data-dropdown]").forEach(function (item) {
    var btn = item.querySelector(".primary-nav__dropbtn");
    if (!btn) return;
    var hoverTimer;

    function setOpen(open) {
      item.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", String(open));
    }
    btn.addEventListener("click", function () {
      setOpen(btn.getAttribute("aria-expanded") !== "true");
    });
    item.addEventListener("mouseenter", function () {
      if (!window.matchMedia("(hover: hover)").matches) return;
      clearTimeout(hoverTimer);
      setOpen(true);
    });
    item.addEventListener("mouseleave", function () {
      if (!window.matchMedia("(hover: hover)").matches) return;
      hoverTimer = setTimeout(function () { setOpen(false); }, 160);
    });
    item.addEventListener("focusout", function () {
      requestAnimationFrame(function () {
        if (!item.contains(document.activeElement)) setOpen(false);
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && item.classList.contains("is-open")) {
        setOpen(false);
        btn.focus();
      }
    });
    document.addEventListener("click", function (e) {
      if (!item.contains(e.target)) setOpen(false);
    });
  });

  /* Highlight the current page in the navigation */
  var here = location.pathname.replace(/index\.html$/, "");
  document.querySelectorAll(".primary-nav a, .mobile-menu a").forEach(function (a) {
    var path = new URL(a.href, location.href).pathname.replace(/index\.html$/, "");
    if (path === here) a.setAttribute("aria-current", "page");
  });

  /* Footer year */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* Reveal-on-scroll (skipped entirely for reduced-motion users) */
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches && "IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: "0px 0px -48px 0px" });

    document.querySelectorAll("[data-reveal]").forEach(function (el) {
      el.classList.add("reveal-ready");
      observer.observe(el);
    });
  }

  /* Prefill forms from URL params (e.g. quote/?type=commercial, contact/?topic=survey) */
  var params = new URLSearchParams(location.search);
  document.querySelectorAll("form[data-formspree]").forEach(function (form) {
    params.forEach(function (value, key) {
      var field = form.elements[key];
      if (!field || key.charAt(0) === "_") return;
      try { field.value = value; } catch (e) { /* ignore unknown values */ }
    });
  });

  /* Formspree forms — AJAX submit with in-page success state.
     While the action still contains REPLACE_WITH_FORM_ID, runs in demo mode:
     shows the success state without sending anything (and says so). */
  document.querySelectorAll("form[data-formspree]").forEach(function (form) {
    var panel = document.querySelector(form.getAttribute("data-success") || "");
    var errorBox = form.querySelector(".form-error");

    function showSuccess(isDemo) {
      if (!panel) return;
      form.hidden = true;
      panel.hidden = false;
      var demoNote = panel.querySelector("[data-demo-note]");
      if (demoNote) demoNote.hidden = !isDemo;
      panel.scrollIntoView({ block: "center" });
      panel.focus();
    }

    form.addEventListener("submit", function (e) {
      var action = form.getAttribute("action") || "";
      if (action.indexOf("REPLACE_WITH_FORM_ID") !== -1) {
        e.preventDefault();
        showSuccess(true);
        return;
      }
      e.preventDefault();
      if (errorBox) errorBox.classList.remove("is-visible");
      var submitBtn = form.querySelector('[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;
      fetch(action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      }).then(function (res) {
        if (res.ok) { showSuccess(false); } else { throw new Error("send failed"); }
      }).catch(function () {
        if (errorBox) errorBox.classList.add("is-visible");
      }).finally(function () {
        if (submitBtn) submitBtn.disabled = false;
      });
    });
  });
})();
