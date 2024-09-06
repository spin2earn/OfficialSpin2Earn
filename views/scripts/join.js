function redirectToTelegram() {
    window.open("https://t.me/spintestdemo", "_blank");
    console.log("Opened in a new tab");
    document.addEventListener("visibilitychange", function() {
        if (document.visibilityState === 'visible') {
            window.location.reload();
        }
    });
}
