/**
 * Keep the sole WebGL canvas in the active native-scroll art window. The browser
 * compositor then moves its pixels with that window, rather than waiting for a
 * JavaScript-measured fixed scissor during an asynchronous touch scroll.
 */
export function createNativePresentation({ frame, canvas }) {
  if (!frame || !canvas)
    return {
      setMode() {},
      activate() { return false; },
      getHost() { return null; },
      dispose() {},
    };

  const root = frame.ownerDocument.documentElement;
  const document = frame.ownerDocument;
  const originalParent = frame.parentNode;
  const originalNext = frame.nextSibling;
  const anchor = document.createComment("native-world-origin");
  originalParent?.insertBefore(anchor, frame);
  const originallyContained = frame.classList.contains("is-contained");
  const originallyNative = root.classList.contains("native-world");
  const snapshots = new Map();
  let enabled = false;
  let activeHost = null;
  let disposed = false;

  function removeSnapshot(host) {
    const snapshot = snapshots.get(host);
    if (!snapshot) return;
    snapshot.remove();
    snapshots.delete(host);
  }

  function capture(host, beforeSwitch) {
    // Rendering and drawImage must remain in this same JavaScript task: the
    // WebGL renderer intentionally uses preserveDrawingBuffer: false.
    let snapshot;
    try {
      beforeSwitch?.();
      if (canvas.width < 1 || canvas.height < 1) return;
      snapshot = snapshots.get(host) || document.createElement("canvas");
      const context = snapshot.getContext("2d", { alpha: true });
      if (!context) return;
      snapshot.width = canvas.width;
      snapshot.height = canvas.height;
      context.drawImage(canvas, 0, 0, snapshot.width, snapshot.height);
      snapshot.className = "native-world-snapshot";
      snapshot.setAttribute("aria-hidden", "true");
      snapshots.set(host, snapshot);
      host.insertBefore(snapshot, frame);
    } catch {
      // Context loss, allocation limits or a 2D-disabled browser should leave
      // the art-window background intact and still allow the live canvas move.
      if (snapshot && snapshots.get(host) !== snapshot) snapshot.remove();
    }
  }

  function restoreOrigin() {
    if (anchor.parentNode) anchor.parentNode.insertBefore(frame, anchor.nextSibling);
    else if (originalParent) {
      const next = originalNext?.parentNode === originalParent ? originalNext : null;
      originalParent.insertBefore(frame, next);
    }
    activeHost = null;
  }

  function setMode(value) {
    if (disposed) return;
    const next = Boolean(value);
    if (next === enabled) return;
    enabled = next;
    if (enabled) {
      frame.classList.add("is-contained");
      root.classList.add("native-world");
      return;
    }
    restoreOrigin();
    for (const host of snapshots.keys()) removeSnapshot(host);
    if (!originallyContained) frame.classList.remove("is-contained");
    if (!originallyNative) root.classList.remove("native-world");
  }

  function activate(host, beforeSwitch) {
    if (
      disposed || !enabled || !host || host === activeHost ||
      host === frame || frame.contains(host)
    ) return false;
    if (activeHost) capture(activeHost, beforeSwitch);
    host.append(frame);
    activeHost = host;
    // Place the live canvas before discarding this window's old frame, so the
    // new host never has an intermediate background-only DOM state.
    removeSnapshot(host);
    return true;
  }

  function dispose() {
    if (disposed) return;
    setMode(false);
    for (const host of snapshots.keys()) removeSnapshot(host);
    anchor.remove();
    disposed = true;
  }

  return { setMode, activate, getHost: () => activeHost, dispose };
}
