const FitbitApiClient = require("fitbit-node");
const express = require("express");
const rp = require("request-promise");
const https = require("https");
const fs = require("fs");
const path = require("path");
const config = require("../config.js");

const { join } = require("path");
const app = express();

// Serve static assets from the /public folder
app.use(express.static(join(__dirname, "public")));

// Endpoint to serve the configuration file
app.get("/auth_config.json", (req, res) => {
  res.sendFile(join(__dirname, "auth_config.json"));
});

// fitbit auth stuff
let globalScopeId;
let callbackUrl = `https://${config.serverUri}/authorizeCallback`;
const dataServiceEndpoint = `https://${config.dataServiceUri}:${
  config.dataServicePort
}`;

const fitbitClient = new FitbitApiClient({
  clientId: "22DPF6",
  clientSecret: "5f3538567d187a52768935217b220558",
  apiVersion: "1.2" // 1.2 is the default
});

// redirect the user to the Fitbit authorization page
app.get("/accounts/:id/authorizeDevice/fitbit", async (req, res) => {
  try {
    globalScopeId = req.params.id;
    console.log("in authorize route");
    console.log("req.params");
    console.log(req.params);

    let isAccountAuthorized = false;
    //get account details from dataService using id
    //if access token and refresh token are available for account then send user to "this device is already authorized" page or modal.

    if (isAccountAuthorized) {
      return;
    } else {
      console.log(`callbackUrl:`);
      console.log(callbackUrl);
      let url = await fitbitClient.getAuthorizeUrl(
        "activity heartrate location nutrition profile settings sleep social weight",
        callbackUrl
      );
      console.log(url);
      console.log("about to redirect...");
      return res.redirect(url);
    }
  } catch (error) {
    console.log(error);
  }
});

// handle the callback from the Fitbit authorization flow
app.get("/authorizeCallback", async (req, res) => {
  // exchange the authorization code we just received for an access token
  console.log("in callback route");

  let accessTokenResult = await fitbitClient.getAccessToken(
    req.query.code,
    callbackUrl
  );

  let accessToken = accessTokenResult.access_token;
  let refreshToken = accessTokenResult.refresh_token;
  let deviceUserId = accessTokenResult.user_id;

  console.log(deviceUserId);
  console.log(accessToken);
  console.log(refreshToken);

  console.log(`saving access token for id to dataservice /accounts route`);

  console.log(globalScopeId);

  //post this to dataService
  let options = {
    uri: `${dataServiceEndpoint}/accounts/${globalScopeId}`,
    method: "PATCH",
    body: {
      id: globalScopeId,
      devices: [
        {
          make: "fitbit",
          model: "charge3",
          deviceUserId,
          accessToken,
          refreshToken
        }
      ]
    },
    json: true
  };

  try {
    await rp(options);
    return res.redirect(`http://${serverIP}:5000/accounts`);
  } catch (error) {
    console.log(error);
    return res.redirect(`http://${serverIP}:5000/accounts`);
  }
});

// Serve the index page for all other requests
app.get("/*", (_, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

https
  .createServer(
    {
      key: fs.readFileSync(__dirname + "/certs/server.key", "utf8"),
      cert: fs.readFileSync(__dirname + "/certs/server.cert", "utf8")
    },
    app
  )
  .listen(443);