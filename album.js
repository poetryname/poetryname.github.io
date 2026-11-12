(function () {
  "use strict";

  // ============ НАСТРОЙКИ (уже под ваш сайт) ============
  var OWNER  = "poetryname";
  var REPO   = "poetryname.github.io";
  var FOLDER = ""; // фотографии лежат в корне репозитория
  var EXCLUDE = ["author.jpg", "fon.png.png", "sea-wall.png"]; // старые картинки сайта — не в альбом
  // ======================================================

  var EXTS = ["jpg", "jpeg", "png", "webp", "gif", "avif", "jfif"];
  var album = document.getElementById("album");

  if (!album) {
    console.warn('album.js: на странице нет элемента <div id="album"></div>');
    return;
  }

  var css = [
    ".album-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin:16px 0}",
    ".album-thumb{padding:0;border:0;background:none;cursor:zoom-in;border-radius:8px;overflow:hidden;line-height:0}",
    ".album-thumb img{width:100%;height:100%;object-fit:cover;aspect-ratio:4/3;display:block;transition:transform .15s}",
    ".album-thumb img:hover{transform:scale(1.04)}",
    ".album-msg{color:#888;padding:12px 0}",
    ".album-lightbox{position:fixed;inset:0;background:rgba(0,0,0,.93);z-index:99999;display:none;align-items:center;justify-content:center}",
    ".album-lightbox.album-open{display:flex}",
    ".album-lightbox img{max-width:92vw;max-height:90vh;box-shadow:0 0 30px rgba(0,0,0,.6);-webkit-user-drag:none}",
    ".album-btn{position:fixed;top:50%;transform:translateY(-50%);background:rgba(255,255,255,.12);color:#fff;border:0;border-radius:50%;width:52px;height:52px;font-size:30px;line-height:1;cursor:pointer;z-index:100001}",
    ".album-btn:hover{background:rgba(255,255,255,.28)}",
    ".album-prev{left:18px}.album-next{right:18px}",
    ".album-close{position:fixed;top:16px;right:18px;width:44px;height:44px;font-size:24px;transform:none}",
    ".album-counter{position:fixed;bottom:18px;left:50%;transform:translateX(-50%);color:#fff;font-size:15px;opacity:.85;font-family:sans-serif}",
    ".album-caption{position:fixed;bottom:46px;left:50%;transform:translateX(-50%);color:#fff;font-size:12px;opacity:.6;max-width:80vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    "@media (max-width:600px){.album-btn{width:42px;height:42px;font-size:24px}}"
  ].join("\n");
  var st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);

  var api = "https://api.github.com/repos/" + encodeURIComponent(OWNER) +
            "/" + encodeURIComponent(REPO) + "/contents" +
            (FOLDER ? "/" + encodeURIComponent(FOLDER) : "");

  fetch(api)
    .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(function (list) {
      if (!Array.isArray(list)) throw new Error("Это не список файлов");
      var photos = list.filter(function (f) {
        var ext = (f.name.split(".").pop() || "").toLowerCase();
        return f.type === "file" &&
               EXTS.indexOf(ext) !== -1 &&
               EXCLUDE.indexOf(f.name.toLowerCase()) === -1;
      }).sort(function (a, b) {
        return a.name.localeCompare(b.name, undefined, { numeric: true });
      }).map(function (f) { return { name: f.name, url: f.download_url }; });

      if (!photos.length) {
        album.innerHTML = '<p class="album-msg">Фотографии не найдены.</p>';
        return;
      }
      renderGrid(photos);
    })
    .catch(function (e) {
      album.innerHTML = '<p class="album-msg">Не удалось загрузить фотографии. Проверьте настройки в начале album.js.</p>';
      console.error("album.js:", e);
    });

  function renderGrid(photos) {
    currentPhotos = photos;
    var grid = document.createElement("div");
    grid.className = "album-grid";
    photos.forEach(function (p, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "album-thumb";
      b.title = p.name;
      var img = document.createElement("img");
      img.loading = "lazy";
      img.alt = p.name;
      img.src = p.url;
      b.appendChild(img);
      b.addEventListener("click", function () { open(i); });
      grid.appendChild(b);
    });
    album.appendChild(grid);
  }

  var box, big, counter, caption, current = 0, currentPhotos = [];

  function buildViewer() {
    box = document.createElement("div");
    box.className = "album-lightbox";
    big = document.createElement("img");
    box.appendChild(big);

    var prev = document.createElement("button");
    prev.className = "album-btn album-prev";
    prev.innerHTML = "&#8249;"; // назад
    prev.addEventListener("click", function (e) { e.stopPropagation(); step(-1); });

    var next = document.createElement("button");
    next.className = "album-btn album-next";
    next.innerHTML = "&#8250;"; // дальше
    next.addEventListener("click", function (e) { e.stopPropagation(); step(1); });

    var close = document.createElement("button");
    close.className = "album-btn album-close";
    close.innerHTML = "&times;";
    close.addEventListener("click", function (e) { e.stopPropagation(); hide(); });

    counter = document.createElement("div");
    counter.className = "album-counter";
    caption = document.createElement("div");
    caption.className = "album-caption";

    box.appendChild(prev); box.appendChild(next); box.appendChild(close);
    box.appendChild(counter); box.appendChild(caption);

    box.addEventListener("click", function (e) { if (e.target === box) hide(); });

    document.addEventListener("keydown", function (e) {
      if (!box.classList.contains("album-open")) return;
      if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "Escape") hide();
    });

    var sx = 0;
    box.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
    box.addEventListener("touchend", function (e) {
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
    }, { passive: true });

    document.body.appendChild(box);
  }

  function open(i) {
    if (!box) buildViewer();
    current = i;
    show();
    box.classList.add("album-open");
  }

  function show() {
    var p = currentPhotos[current];
    big.src = p.url;
    counter.textContent = (current + 1) + " / " + currentPhotos.length;
    caption.textContent = p.name;
    [current + 1, current - 1].forEach(function (n) {
      if (n >= 0 && n < currentPhotos.length) { var im = new Image(); im.src = currentPhotos[n].url; }
    });
  }

  function step(d) {
    current = (current + d + currentPhotos.length) % currentPhotos.length;
    show();
  }

  function hide() { box.classList.remove("album-open"); }
})();
