(function () {
  let _interval = null;
  let _seed = Date.now();

  function _pad(n, len) {
    return String(n).padStart(len || 2, "0");
  }

  function _timeHtml(ms) {
    const d = new Date(ms);
    return (
      _pad(d.getHours()) +
      ":" +
      _pad(d.getMinutes()) +
      ":" +
      _pad(d.getSeconds()) +
      '<span style="opacity:.45">.' +
      _pad(d.getMilliseconds(), 3) +
      "</span>"
    );
  }

  function start() {
    _interval = setInterval(function () {
      _seed = Date.now();
      $("#seed-value").text(_seed);
      $("#seed-time").html(_timeHtml(_seed));
    }, 50);
  }

  function stop() {
    clearInterval(_interval);
    _interval = null;
    return _seed;
  }

  window.SeedManager = { start, stop };
})();
