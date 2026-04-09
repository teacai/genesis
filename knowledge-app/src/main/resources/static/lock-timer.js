(function() {
    var timeout = window.__lockTimeout;
    if (!timeout || timeout <= 0) return;

    var ms = timeout * 60 * 1000;
    var timer;

    function resetTimer() {
        clearTimeout(timer);
        timer = setTimeout(lockNow, ms);
    }

    function lockNow() {
        fetch('/api/lock', { method: 'POST' }).then(function() {
            window.location.href = '/lock';
        });
    }

    ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'].forEach(function(evt) {
        document.addEventListener(evt, resetTimer, { passive: true });
    });

    resetTimer();
})();
