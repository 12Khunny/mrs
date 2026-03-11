window.MrsUi = (() => {
    function setPanelStatus(panelEl, text, kind) {
        panelEl.className = "status-panel" + (kind ? ` ${kind}` : "");
        panelEl.innerText = text;
    }

    function setConnectionBadge(dotEl, textEl, isConnected, connectedText, disconnectedText) {
        dotEl.classList.remove("connected", "failed");
        dotEl.classList.add(isConnected ? "connected" : "failed");
        textEl.innerText = isConnected ? connectedText : disconnectedText;
    }

    function setDebug(debugEl, value) {
        if (typeof value === "string") {
            debugEl.innerText = value;
            return;
        }
        debugEl.innerText = JSON.stringify(value, null, 2);
    }

    return {
        setPanelStatus,
        setConnectionBadge,
        setDebug
    };
})();
