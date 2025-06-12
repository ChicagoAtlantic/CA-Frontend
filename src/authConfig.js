export const msalConfig = {
  auth: {
    clientId: "a5e415a2-f20f-4f2d-8ab2-46297e8115bc",
    authority: "https://login.microsoftonline.com/057ea06d-e686-4d44-9a4a-9627265f07db",
    redirectUri: window.location.origin, // ✅ Works for both localhost and prod
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ["openid", "profile", "email"],
};
