(function () {
  const rootContainer = document.getElementById("root");
  let root = null;

  function renderError(message) {
    if (root && window.ReactDOM && typeof window.ReactDOM.createRoot === "function") {
      try {
        root.unmount();
      } catch (error) {
        console.error("Failed to unmount artifact root:", error);
      }
      root = null;
    }
    rootContainer.innerHTML = '<pre class="artifact-error"></pre>';
    rootContainer.querySelector("pre").textContent = message;
  }

  function ensureDependencies() {
    if (!window.React) throw new Error("React failed to load inside artifact runner.");
    if (!window.ReactDOM) throw new Error("ReactDOM failed to load inside artifact runner.");
    if (!window.Recharts) throw new Error("Recharts failed to load inside artifact runner.");
    if (!window.Babel) throw new Error("Babel failed to load inside artifact runner.");
  }

  function createRequire() {
    const moduleMap = {
      react: window.React,
      "react/jsx-runtime": window.React,
      "react/jsx-dev-runtime": window.React,
      "react-dom": window.ReactDOM,
      recharts: window.Recharts,
    };

    return function requireShim(name) {
      if (!(name in moduleMap)) {
        throw new Error(`Artifact tried to import unsupported module "${name}".`);
      }
      return moduleMap[name];
    };
  }

  window.addEventListener("message", (event) => {
    const payload = event.data || {};
    if (typeof payload.code !== "string") return;

    const responseOrigin = event.origin || "*";

    try {
      ensureDependencies();

      const transformed = window.Babel.transform(payload.code, {
        filename: "artifact.tsx",
        presets: ["typescript", "react"],
        plugins: ["transform-modules-commonjs"],
      }).code;

      const module = { exports: {} };
      const exports = module.exports;
      const require = createRequire();
      const executor = new Function(
        "require",
        "module",
        "exports",
        transformed + ";return module.exports;",
      );

      const executed = executor(require, module, exports);
      const componentCandidate = executed?.default ?? module.exports?.default ?? executed;

      if (typeof componentCandidate !== "function") {
        throw new Error("Artifact must export a React component (export default).");
      }

      if (!root) {
        root = window.ReactDOM.createRoot(rootContainer);
      }
      root.render(window.React.createElement(componentCandidate));

      window.parent.postMessage(
        { renderId: payload.renderId, status: "ok" },
        responseOrigin,
      );
    } catch (error) {
      const message = error && error.message ? error.message : "Failed to render artifact.";
      console.error("Artifact runner error:", error);
      renderError(message);
      window.parent.postMessage(
        { renderId: payload.renderId, status: "error", message },
        responseOrigin,
      );
    }
  });
})();

