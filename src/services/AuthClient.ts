import Cookies from "js-cookie";
import client from "./ApolloClient";
import RestClient from "./RestClient";
import createAuth0Client from "@auth0/auth0-spa-js";
import config from "../../client/auth_config.json";
import * as $ from "jquery";
import auth0 from "auth0-js";

export default class AuthClient {
  public auth0;
  public webAuth = new auth0.WebAuth({
    domain:       config.domain,
    clientID:     config.clientId
  });
  public restClient = new RestClient();

  constructor() {
    this.init();
  }

  async init() {
    this.auth0 = await createAuth0Client({
      domain: config.domain,
      client_id: config.clientId,
      redirect_uri: window.location.origin
    });
  }

  async getUserData(dispatch) {
    return new Promise((resolve, reject) => {
      const token = Cookies.get("scordAccessToken");
      const auth0Id = Cookies.get("scordAuth0Id");
  
      this.restClient.makeRequest(
        process.env.SERVER_URL + "/accounts/" + auth0Id, 
        {}, 
        () => console.info("getUserData finished"),
        "GET", 
        { "content-type": "application/json" },
        false
      ).then(res => {
        if (dispatch) {
          dispatch({
            type: "setUserData",
            userData: res,
          });
        }
        resolve(res);
      })
    });
  }

  // TODO: use route constants
  async signup(values, callback, onError) {
    // auth0 user create
    this.restClient.makeRequest(
      "https://" + config.domain + "/dbconnections/signup", 
      {
        "client_id": config.clientId,
        "connection": "Username-Password-Authentication",
        ...values
      }, 
      () => console.info("Step 1 finished"), 
      "POST", 
      { "content-type": "application/x-www-form-urlencoded" },
      false,
      onError
    ).then((res) => {
      console.info("res", res, values)
      // data-service user create
      if (typeof res['body']['_id'] !== "undefined") {
        this.createLocalAccount(res['body']['_id'], values, callback, onError);
      } else {
        console.error(res);
      }
    });
  }

  async createLocalAccount(id, values, callback, onError) {
    this.restClient.makeRequest(
      "/accounts", 
      {
        "id": id,
        ...values
      }, 
      callback, // finish
      "POST", 
      { "content-type": "application/json" },
      false,
      onError
    )
  }

  async updateAccount(id, values, callback, onError) {
    // data-service user update
    this.restClient.makeRequest(
      "/accounts/" + id, 
      values, 
      callback, // finish
      "PATCH", 
      { "content-type": "application/json" },
      false,
      onError
    )
  }

  forgotPassword(values, callback) {
    this.restClient.makeRequest(
      "https://" + config.domain + "/dbconnections/change_password", 
      {
        email: values.email,
        client_id: config.clientId,
        connection: values.connection
      }, 
      callback, 
      "POST", 
      { "content-type": "application/x-www-form-urlencoded" },
      false
    ).then(data => {
      console.info("data", data);
    })
  }

  async login(values, callback, onError) {
    // the local User _id is not used, we use the associated auth0 id
    // auth0 token request
    this.restClient.makeRequest(
      "https://" + config.domain + "/oauth/token", 
      {
        grant_type: "password",
        client_id: config.clientId,
        // client_secret
        // audience
        // scope
        // realm
        ...values
      }, 
      callback,
      "POST", 
      { "content-type": "application/x-www-form-urlencoded" },
      false,
      onError
    ).then(res => {
      const token = res['body']['access_token'];

      Cookies.set("scordAccessToken", token);

      this.setAuth0Id(token, callback, onError);
    })
  }

  setAuth0Id(token, callback, onError) {
    // auth0 id request #1
    this.restClient.makeRequest(
      "https://" + config.domain + "/userinfo", 
      {
        access_token: token
      }, 
      callback,
      "POST", 
      { "content-type": "application/x-www-form-urlencoded" },
      false,
      onError
    ).then(res2 => {
      const auth0Id = res2['body']['sub'].split("auth0|")[1];
      
      Cookies.set("scordAuth0Id", auth0Id);

      setTimeout(() => {
        window.location.replace("/");
      }, 500);
    })
  }

  getAuth0UserInfo(token) {
    let self = this;
    return new Promise((resolve, reject) => {
      // this.webAuth.parseHash({ hash: window.location.hash }, function(err, authResult) {
      //   if (err) {
      //     reject(err);
      //   }
        self.webAuth.client.userInfo(token, function(err, user) {
          if (err) {
            reject(err);
          }
          resolve(user);
        });
      // });
    })
    
  }

  socialLogin(connection, callback) {
    // const queryString = this.restClient.paramsToString({
    //   response_type: "token",
    //   client_id: config.clientId,
    //   redirect_uri: process.env.SERVER_URL,
    //   connection
    // });
    // const fullUrl = "https://" + config.domain + "/authorize" + queryString;
    // window.location.href = fullUrl;
    console.info("auth0", this.auth0, this.webAuth);
    this.webAuth.authorize({
      connection,
      responseType: "token",
      redirectUri: process.env.SERVER_URL,
      clientId: config.clientId
    })
  }

  logout() {
    Cookies.remove("scordAccessToken");
    Cookies.remove("scordAuth0Id");
    window.location.href = window.location.origin;
  }
}
