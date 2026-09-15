(function () {
  "use strict";

  var uploadRoot = "uploads/";

  function imagePath(url) {
    return uploadRoot + String(url || "").replace(/^\/+/, "");
  }

  function renderSlideshow(config) {
    var host = document.getElementById(config.elementID + "-slideshow");
    if (!host || !config.images || !config.images.length) return;

    var current = 0;
    var root = document.createElement("section");
    root.className = "ef-slideshow";
    root.setAttribute("aria-label", "Photo slideshow");

    var stage = document.createElement("div");
    stage.className = "ef-slide-stage";
    var main = document.createElement("img");
    main.alt = "Photo 1 of " + config.images.length;
    stage.appendChild(main);

    function button(label, className, symbol) {
      var el = document.createElement("button");
      el.type = "button";
      el.className = "ef-slide-button " + className;
      el.setAttribute("aria-label", label);
      el.textContent = symbol;
      return el;
    }

    var previous = button("Previous photo", "ef-prev", "‹");
    var next = button("Next photo", "ef-next", "›");
    var thumbs = document.createElement("div");
    thumbs.className = "ef-thumbs";
    thumbs.setAttribute("aria-label", "Choose a photo");
    var counter = document.createElement("div");
    counter.className = "ef-counter";

    var thumbButtons = config.images.map(function (item, index) {
      var thumb = document.createElement("button");
      thumb.type = "button";
      thumb.className = "ef-thumb";
      thumb.setAttribute("aria-label", "Show photo " + (index + 1));
      var image = document.createElement("img");
      image.src = imagePath(item.url);
      image.alt = "";
      image.loading = "lazy";
      thumb.appendChild(image);
      thumb.addEventListener("click", function () { show(index); });
      thumbs.appendChild(thumb);
      return thumb;
    });

    function show(index, revealThumbnail) {
      current = (index + config.images.length) % config.images.length;
      main.src = imagePath(config.images[current].url);
      main.alt = "Photo " + (current + 1) + " of " + config.images.length;
      counter.textContent = (current + 1) + " / " + config.images.length;
      thumbButtons.forEach(function (thumb, i) {
        thumb.setAttribute("aria-current", i === current ? "true" : "false");
      });
      if (revealThumbnail) {
        thumbs.scrollLeft = Math.max(0, thumbButtons[current].offsetLeft - (thumbs.clientWidth / 2));
      }
    }

    previous.addEventListener("click", function () { show(current - 1, true); });
    next.addEventListener("click", function () { show(current + 1, true); });
    root.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft") show(current - 1, true);
      if (event.key === "ArrowRight") show(current + 1, true);
    });
    root.appendChild(stage);
    root.appendChild(previous);
    root.appendChild(next);
    root.appendChild(thumbs);
    root.appendChild(counter);
    host.replaceChildren(root);
    show(0);

    if (String(config.autoplay) === "1" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      var timer = window.setInterval(function () { show(current + 1, false); }, Math.max(3, Number(config.speed) || 5) * 1000);
      root.addEventListener("mouseenter", function () { window.clearInterval(timer); }, { once: true });
    }
  }

  function recoverSlideshows() {
    var scripts = Array.prototype.slice.call(document.scripts);
    scripts.forEach(function (script) {
      var text = script.textContent || "";
      if (text.indexOf("wSlideshow.render(") === -1) return;
      var match = text.match(/wSlideshow\.render\((\{[\s\S]*?\})\)\s*\}/);
      if (!match) return;
      try {
        renderSlideshow(Function("return (" + match[1] + ")")());
      } catch (error) {
        console.warn("Could not restore slideshow", error);
      }
    });
  }

  function setupNavigation() {
    var logoLink = document.querySelector("#sitename a");
    if (logoLink) logoLink.setAttribute("href", "index.html");
    var trigger = document.querySelector(".nav-trigger");
    if (!trigger) return;
    trigger.setAttribute("role", "button");
    trigger.setAttribute("tabindex", "0");
    trigger.setAttribute("aria-label", "Open menu");
    trigger.setAttribute("aria-expanded", "false");
    function toggle() {
      var open = document.body.classList.toggle("menu-open");
      trigger.setAttribute("aria-expanded", String(open));
      trigger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }
    trigger.addEventListener("click", toggle);
    trigger.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggle(); }
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && document.body.classList.contains("menu-open")) toggle();
    });
  }

  function setupSearch() {
    var header = document.getElementById("header");
    if (!header || header.querySelector(".ef-search")) return;
    var pages = [
      { url: "index.html", title: "Home", summary: "School news, events and photo galleries" },
      { url: "about-us.html", title: "About Us", summary: "Our mission, history, founder, principal and volunteers" },
      { url: "projects.html", title: "Projects", summary: "Ehsaas Foundation projects and community work" },
      { url: "flood-assistance-2010.html", title: "Flood Assistance 2010", summary: "Flood relief, medical kits and aid distribution" },
      { url: "how-to-donate.html", title: "How to Donate", summary: "Donation and bank transfer instructions" },
      { url: "contact-us.html", title: "Contact Us", summary: "School location and feedback form" }
    ];
    var form = document.createElement("form");
    form.className = "ef-search";
    form.setAttribute("role", "search");
    form.innerHTML = '<label class="sr-only" for="ef-search-input">Search this site</label><input id="ef-search-input" type="search" placeholder="Search" autocomplete="off" aria-controls="ef-search-results" aria-expanded="false"><button type="submit" aria-label="Search">⌕</button><div id="ef-search-results" class="ef-search-results" hidden></div>';
    header.appendChild(form);
    var input = form.querySelector("input");
    var results = form.querySelector(".ef-search-results");
    var searchablePages = pages;
    var firstMatch = null;
    var timer;

    if (window.location.protocol !== "file:") {
      Promise.all(pages.map(function (page) {
        return fetch(page.url).then(function (response) { return response.text(); }).then(function (html) {
          var doc = new DOMParser().parseFromString(html, "text/html");
          return Object.assign({}, page, { text: (doc.querySelector("#wsite-content") || doc.body).textContent.replace(/\s+/g, " ") });
        }).catch(function () { return Object.assign({}, page, { text: page.summary }); });
      })).then(function (items) { searchablePages = items; });
    }

    function search() {
      var query = input.value.trim().toLowerCase();
      results.replaceChildren();
      firstMatch = null;
      if (query.length < 2) {
        results.hidden = true;
        input.setAttribute("aria-expanded", "false");
        return;
      }
      var matches = searchablePages.filter(function (page) {
        return (page.title + " " + page.summary + " " + (page.text || "")).toLowerCase().indexOf(query) !== -1;
      });
      matches.slice(0, 6).forEach(function (page) {
        var link = document.createElement("a");
        link.href = page.url;
        link.innerHTML = "<strong>" + page.title + "</strong><span>" + page.summary + "</span>";
        results.appendChild(link);
        if (!firstMatch) firstMatch = link;
      });
      if (!matches.length) {
        var empty = document.createElement("p");
        empty.textContent = "No pages found";
        results.appendChild(empty);
      }
      results.hidden = false;
      input.setAttribute("aria-expanded", "true");
    }

    input.addEventListener("input", function () {
      window.clearTimeout(timer);
      timer = window.setTimeout(search, 120);
    });
    input.addEventListener("focus", function () { if (input.value.trim().length >= 2) search(); });
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      search();
      if (firstMatch) window.location.href = firstMatch.href;
    });
    document.addEventListener("click", function (event) {
      if (!form.contains(event.target)) {
        results.hidden = true;
        input.setAttribute("aria-expanded", "false");
      }
    });
  }

  function setupLightbox() {
    var links = document.querySelectorAll('.imageGallery a[href]');
    if (!links.length) return;
    var box = document.createElement("div");
    box.className = "ef-lightbox";
    box.hidden = true;
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", "Expanded photo");
    var image = document.createElement("img");
    image.alt = "Expanded gallery photo";
    var close = document.createElement("button");
    close.type = "button";
    close.setAttribute("aria-label", "Close photo");
    close.textContent = "×";
    box.appendChild(image);
    box.appendChild(close);
    document.body.appendChild(box);
    var lastFocus;
    function hide() {
      box.hidden = true;
      image.removeAttribute("src");
      if (lastFocus) lastFocus.focus();
    }
    links.forEach(function (link) {
      link.removeAttribute("rel");
      link.classList.remove("w-fancybox");
      link.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        lastFocus = link;
        image.src = link.getAttribute("href");
        box.hidden = false;
        close.focus();
      }, true);
    });
    close.addEventListener("click", hide);
    box.addEventListener("click", function (event) { if (event.target === box) hide(); });
    document.addEventListener("keydown", function (event) { if (event.key === "Escape" && !box.hidden) hide(); });
  }

  function repairEmbeds() {
    document.querySelectorAll('iframe[src^="http://player.vimeo.com"]').forEach(function (frame) {
      frame.src = frame.src.replace("http://", "https://");
      frame.setAttribute("title", "Ehsaas Foundation School video");
    });
    document.querySelectorAll(".wsite-map iframe").forEach(function (frame) {
      frame.src = "https://www.google.com/maps?q=33.6939092,72.9770591&z=14&output=embed";
      frame.setAttribute("title", "Map showing Ehsaas Foundation School");
      frame.removeAttribute("scrolling");
    });
    document.querySelectorAll("iframe:not([title])").forEach(function (frame) {
      frame.setAttribute("title", "Embedded media");
    });
  }

  function repairContactForm() {
    var form = document.querySelector("#form-963451382294170120");
    if (!form) return;
    var hiddenSubmit = form.querySelector('input[type="submit"]');
    if (hiddenSubmit) hiddenSubmit.style.display = "none";
    var oldButton = form.querySelector(".wsite-button");
    if (!oldButton) return;
    oldButton.setAttribute("role", "button");
    oldButton.setAttribute("tabindex", "0");
    var submit = function () {
      var required = Array.prototype.slice.call(form.querySelectorAll("[aria-required='true']"));
      var missing = required.find(function (field) { return !field.value.trim(); });
      if (missing) { missing.focus(); missing.reportValidity && missing.reportValidity(); return; }
      var status = form.querySelector(".ef-form-status") || document.createElement("div");
      status.className = "ef-form-status";
      status.innerHTML = 'Thank you. The old Weebly form service is no longer connected. Please send this message through the <a href="https://facebook.com/Ehsaasfoundationschoolgolrasharif" target="_blank" rel="noopener">Ehsaas Foundation Facebook page</a>.';
      form.appendChild(status);
      status.scrollIntoView({ behavior: "smooth", block: "nearest" });
    };
    form.addEventListener("submit", function (event) { event.preventDefault(); submit(); });
    oldButton.addEventListener("click", submit);
    oldButton.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); submit(); }
    });
  }

  function removeWeeblyBranding() {
    var footer = document.getElementById("footer-content");
    if (footer) footer.textContent = "© " + new Date().getFullYear() + " Ehsaas Foundation";
  }

  function init() {
    recoverSlideshows();
    setupNavigation();
    setupSearch();
    setupLightbox();
    repairEmbeds();
    repairContactForm();
    removeWeeblyBranding();
    document.body.classList.add("site-ready");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
}());
