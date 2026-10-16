/* WorthChex site behaviour: mobile menu and current-page highlighting. */
(function () {
  "use strict";

  function init() {
    var toggle = document.querySelector(".nav-toggle");
    var panel = document.getElementById("site-menu");
    if (toggle && panel) {
      var close = function () {
        toggle.setAttribute("aria-expanded", "false");
        panel.classList.remove("open");
      };
      toggle.addEventListener("click", function () {
        var open = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", open ? "false" : "true");
        panel.classList.toggle("open", !open);
      });
      document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && panel.classList.contains("open")) {
          close();
          toggle.focus();
        }
      });
      document.addEventListener("click", function (event) {
        if (!panel.classList.contains("open")) return;
        if (panel.contains(event.target) || toggle.contains(event.target)) return;
        close();
      });
    }

    var here = window.location.pathname.replace(/index\.html$/, "");
    document.querySelectorAll(".nav-links a, .nav-panel a").forEach(function (link) {
      var path = link.getAttribute("href");
      if (path && path !== "/" && path === here) link.setAttribute("aria-current", "page");
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
