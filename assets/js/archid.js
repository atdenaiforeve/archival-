(() => {
  "use strict";

  const API = "https://archivaldeviceidentity.pagey101212.workers.dev";
  const COOKIE = "ARCHID";
  const COOKIE_PATH = "/archival-/";
  const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
  let token = null;
  let profile = null;
  let state = "starting";

  function readCookie(name) {
    const prefix = name + "=";
    const item = document.cookie.split(";").map(part => part.trim()).find(part => part.startsWith(prefix));
    return item ? decodeURIComponent(item.slice(prefix.length)) : null;
  }

  function writeCookie(value) {
    document.cookie = COOKIE + "=" + encodeURIComponent(value) +
      "; Path=" + COOKIE_PATH +
      "; Max-Age=" + COOKIE_MAX_AGE +
      "; SameSite=Lax; Secure";
  }

  function clearCookie() {
    document.cookie = COOKIE + "=; Path=" + COOKIE_PATH +
      "; Max-Age=0; SameSite=Lax; Secure";
  }

  async function request(path, options = {}, includeToken = true) {
    const headers = new Headers(options.headers || {});
    if (includeToken && token) headers.set("Authorization", "Bearer " + token);
    if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    const response = await fetch(API + path, { ...options, headers, cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || "ARCHID request failed (" + response.status + ")");
      error.status = response.status;
      throw error;
    }
    return data;
  }

  function announce(nextState) {
    state = nextState;
    window.dispatchEvent(new CustomEvent("archid-state", {
      detail: { state, profileId: profile && profile.profileId }
    }));
  }

  async function createIdentity() {
    const result = await request("/v1/identity/create", { method: "POST" }, false);
    token = result.token;
    profile = { profileId: result.profileId, createdAt: result.createdAt };
    writeCookie(token);
    announce("ready");
    return profile;
  }

  async function initialise() {
    token = readCookie(COOKIE);
    if (!token) return createIdentity();

    try {
      profile = await request("/v1/me");
      announce("ready");
      return profile;
    } catch (error) {
      if (error.status === 401) {
        clearCookie();
        token = null;
        profile = null;
        return createIdentity();
      }
      announce("offline");
      throw error;
    }
  }

  const ready = initialise().catch(error => {
    console.warn("[ARCHID] Identity service unavailable:", error.message);
    announce("offline");
    throw error;
  });

  const ARCHID = {
    ready,
    get state() { return state; },
    get profile() { return profile; },

    async getProgress() {
      await ready;
      return (await request("/v1/progress")).progress;
    },

    async saveProgress(key, value) {
      await ready;
      if (typeof key !== "string" || !key.length) throw new Error("A progress key is required.");
      return request("/v1/progress/" + encodeURIComponent(key), {
        method: "PUT",
        body: JSON.stringify({ value })
      });
    },

    async createPairingCode() {
      await ready;
      return request("/v1/pairing/create", { method: "POST" });
    },

    async pairDevice(code) {
      const result = await request("/v1/pairing/redeem", {
        method: "POST",
        body: JSON.stringify({ code })
      }, false);
      token = result.token;
      profile = { profileId: result.profileId, paired: true };
      writeCookie(token);
      announce("ready");
      return profile;
    },

    async revokeThisDevice() {
      await ready;
      await request("/v1/device", { method: "DELETE" });
      clearCookie();
      token = null;
      profile = null;
      announce("revoked");
    }
  };

  Object.defineProperty(window, "ARCHID", { value: ARCHID, configurable: false, writable: false });
})();