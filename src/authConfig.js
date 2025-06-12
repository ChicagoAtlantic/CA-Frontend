export const msalConfig = {
  auth: {
    clientId: "a5e415a2-f20f-4f2d-8ab2-46297e8115bc", // from Azure Portal > App registrations > ChatCAG_Web > Overview
    authority: "https://login.microsoftonline.com/057ea06d-e686-4d44-9a4a-9627265f07db", // Or your tenant ID if you want to restrict further
    redirectUri: "http://localhost:3000",
  },
  cache: {
    cacheLocation: "localStorage", // to persist login
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ["openid", "profile", "email"],
};
