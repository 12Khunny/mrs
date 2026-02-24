const { contextBridge } = require("electron");

let runtimeConfig = {};

try {
  runtimeConfig = JSON.parse(process.env.MRS_RUNTIME_CONFIG || "{}");
} catch {
  runtimeConfig = {};
}

contextBridge.exposeInMainWorld("mrsRuntimeConfig", runtimeConfig);
