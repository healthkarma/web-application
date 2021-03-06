import * as React from "react";
import ErrorBoundary from "react-error-boundary";
import { CookiesProvider } from "react-cookie";
import { Router, View } from "react-navi";

import App from "./components/layout/App/App";
import routes from "./routes";

// import * as mixpanel from "mixpanel-browser";
// import { MixpanelProvider } from "react-mixpanel";
// import * as Sentry from "@sentry/browser";
// import FullStory from "react-fullstory";
import ErrorFallback from "./components/pages/status/ErrorFallback/ErrorFallback";
import { AppContextAPI } from "./context/AppContextAPI";
import client from "./services/ApolloClient";
import { ErrorHandler } from "./services/ErrorHandler";
import { Auth0Provider } from "./Auth0";
import config from "../client/auth_config.json";

const styles = require("./sass/style.scss");

// mixpanel.init(process.env.MIXPANEL_SECRET);

// if (process.env.NODE_ENV !== "development") {
//   Sentry.init({ dsn: process.env.SENTRY });
// }

interface AppProviderProps {}

interface RootProviderProps {}

const onRedirectCallback = appState => {
  window.history.replaceState(
    {},
    document.title,
    appState && appState.targetUrl
      ? appState.targetUrl
      : window.location.pathname
  );
};

export const AppProvider: React.FC<AppProviderProps> = props => {
  return (
    <AppContextAPI>
      <View />
    </AppContextAPI>
  );
};

const RootProvider: React.FC<RootProviderProps> = props => {
  return (
    <ErrorBoundary onError={ErrorHandler} FallbackComponent={ErrorFallback}>
      {/* <MixpanelProvider mixpanel={mixpanel}> */}
        {process.env.NODE_ENV !== "development" ? (
          <>
            {/* <FullStory org="KKJA5" /> */}
          </>
        ) : (
          <></>
        )}
          {/** TODO: Good spot for Layout if desire no rerender, consider best placement for context */}
          <CookiesProvider>
            <Auth0Provider
              domain={config.domain}
              client_id={config.clientId}
              redirect_uri={window.location.origin}
              onRedirectCallback={onRedirectCallback}
            >

            </Auth0Provider>
            <Router routes={routes}>
              <AppProvider />
            </Router>
          </CookiesProvider>
      {/* </MixpanelProvider> */}
    </ErrorBoundary>
  );
};

export default RootProvider;
