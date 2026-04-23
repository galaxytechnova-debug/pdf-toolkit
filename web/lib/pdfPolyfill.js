if (typeof window === "undefined" && typeof globalThis !== "undefined") {
  if (!globalThis.DOMMatrix) {
    globalThis.DOMMatrix = class DOMMatrix {};
  }
}
