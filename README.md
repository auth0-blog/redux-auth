# Redux JWT Authentication Sample

This is a sample of how to implement JWT authentication in React and [Redux](https://github.com/rackt/redux) apps. It uses Auth0's [NodeJS JWT Authentication Sample](https://github.com/auth0/nodejs-jwt-authentication-sample) to authenticate users and retrieve quotes from a protected endpoint.

In this sample we will use Auth0's [Lock Library](https://auth0.com/docs/libraries/lock). We will install Lock via npm and include it with the rest of our code using Webpack.

The sample is well-informed by the official [Redux examples](https://github.com/rackt/redux/tree/master/examples).

## Installation

Clone the repo and run the installation commands, each in a new terminal window.

```bash
# Get the server submodule
git submodule update --init

# Install deps in the project root and in the server directory
npm install
cd server && npm install
cd ..

```

## Auth0 Settings

Navigate to your App's Settings page in your Auth0 account.

#### CORS

Add your Origin URLs to the Allowed Origins (CORS) list. For this example it would be `http://localhost:3000/`.

#### Update actions.js

Update the login function in your actions with your app's Auth0 ClientID and Domain.

```js
// Opens the Lock widget and
// dispatches actions along the way
export function login() {
  const lock = new Auth0Lock('YOUR_CLIENT_ID', 'YOUR_CLIENT_DOMAIN');
  ...
}
```

#### Update server/protected-routes

Update the jwtCheck variable in `server/protected-routes.js` to the following:

```js
var jwtCheck = jwt({
  secret: new Buffer('YOUR_CLIENT_SECRET', 'base64'),
  audience: 'YOUR_CLIENT_ID'
});
```

## Running the Sample

```bash
# Run the server
npm run server

# New terminal window
npm start
```

The app will be served at `localhost:3000`.

## Important Snippets

Users are authenticated using the Auth0 Lock widget. We have actions setup for this.

```js
// actions.js

// There are two possible states for our login
// process and we need actions for each of them.
//
// We also need one to show the Lock widget.
export const SHOW_LOCK = 'SHOW_LOCK'
export const LOCK_SUCCESS = 'LOCK_SUCCESS'
export const LOCK_ERROR = 'LOCK_ERROR'

function showLock() {
  return {
    type: SHOW_LOCK
  }
}

function lockSuccess(profile, token) {
  return {
    type: LOCK_SUCCESS,
    profile,
    token
  }
}

function lockError(err) {
  return {
    type: LOCK_ERROR,
    err
  }
}

// Three possible states for our logout process as well.
// Since we are using JWTs, we just need to remove the token
// from localStorage. These actions are more useful if we
// were calling the API to log the user out
export const LOGOUT_REQUEST = 'LOGOUT_REQUEST'
export const LOGOUT_SUCCESS = 'LOGOUT_SUCCESS'
export const LOGOUT_FAILURE = 'LOGOUT_FAILURE'

function requestLogout() {
  return {
    type: LOGOUT_REQUEST,
    isFetching: true,
    isAuthenticated: true
  }
}

function receiveLogout() {
  return {
    type: LOGOUT_SUCCESS,
    isFetching: false,
    isAuthenticated: false
  }
}

// Opens the Lock widget and
// dispatches actions along the way
const lock = new Auth0Lock('YOUR_CLIENT_ID', 'YOUR_CLIENT_DOMAIN');

export function login() {
  return dispatch => {
    lock.show()
  }
}

export function authenticate(){
  return dispatch => {
    lock.on("authenticated", function(authResult) {
      // Use the token in authResult to getUserInfo() and save it to localStorage
      lock.getUserInfo(authResult.accessToken, function(error, profile) {
        if (error) {
          // Handle error
          return dispatch(lockError(error));
        }
        localStorage.setItem('profile', JSON.stringify(profile))
        localStorage.setItem('id_token', authResult.accessToken)
        return dispatch(lockSuccess(profile,authResult.accessToken));
      });
    });
  }
}
// Logs the user out
export function logoutUser() {
  return dispatch => {
    dispatch(requestLogout())
    localStorage.removeItem('id_token')
    localStorage.removeItem('profile')
    dispatch(receiveLogout())
  }
}
```
We now need a listener on the main App file

autheticate needs to be included from the actions and called within the Constructor

```js
/// containers/App.js

import { loginUser, fetchQuote, fetchSecretQuote, authenticate } from '../actions'

  constructor(props) {
    super(props);
    this.props.dispatch(authenticate());
  }

```

We also have actions for retreiving the quotes that uses an API middleware.

```js
// middleware/api.js

const BASE_URL = 'http://localhost:3001/api/'

function callApi(endpoint, authenticated) {

  let token = localStorage.getItem('id_token') || null
  let config = {}

  if(authenticated) {
    if(token) {
      config = {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    } else {
      throw "No token saved!"
    }
  }

  return fetch(BASE_URL + endpoint, config)
    .then(response =>
      response.text()
      .then(text => ({ text, response }))
    ).then(({ text, response }) => {
      if (!response.ok) {
        return Promise.reject(text)
      }

      return text
    }).catch(err => console.log(err))
}

export const CALL_API = Symbol('Call API')

export default store => next => action => {

  const callAPI = action[CALL_API]

  // So the middleware doesn't get applied to every single action
  if (typeof callAPI === 'undefined') {
    return next(action)
  }

  let { endpoint, types, authenticated } = callAPI

  const [ requestType, successType, errorType ] = types

  // Passing the authenticated boolean back in our data will let us distinguish between normal and secret quotes
  return callApi(endpoint, authenticated).then(
    response =>
      next({
        response,
        authenticated,
        type: successType
      }),
    error => next({
      error: error.message || 'There was an error.',
      type: errorType
    })
  )
}
```

```js
// actions.js

// Uses the API middlware to get a quote
export function fetchQuote() {
  return {
    [CALL_API]: {
      endpoint: 'random-quote',
      types: [QUOTE_REQUEST, QUOTE_SUCCESS, QUOTE_FAILURE]
    }
  }
}

// Same API middlware is used to get a
// secret quote, but we set authenticated
// to true so that the auth header is sent
export function fetchSecretQuote() {
  return {
    [CALL_API]: {
      endpoint: 'protected/random-quote',
      authenticated: true,
      types: [QUOTE_REQUEST, QUOTE_SUCCESS, QUOTE_FAILURE]
    }
  }
}
```

The reducers return new objects with the data carried by the actions.

```js
// reducers.js

import { combineReducers } from 'redux'
import {
  LOCK_SUCCESS, LOGOUT_SUCCESS,
  QUOTE_REQUEST, QUOTE_SUCCESS, QUOTE_FAILURE
} from './actions'

// The auth reducer. The starting state sets authentication
// based on a token being in local storage. In a real app,
// we would also want a util to check if the token is expired.
function auth(state = {
    isFetching: false,
    isAuthenticated: localStorage.getItem('id_token') ? true : false
  }, action) {
  switch (action.type) {
    case LOCK_SUCCESS:
      return Object.assign({}, state, {
        isFetching: false,
        isAuthenticated: true,
        errorMessage: ''
      })
    case LOGOUT_SUCCESS:
      return Object.assign({}, state, {
        isFetching: true,
        isAuthenticated: false
      })
    default:
      return state
    }
}

// The quotes reducer
function quotes(state = {
    isFetching: false,
    quote: '',
    authenticated: false
  }, action) {
  switch (action.type) {
    case QUOTE_REQUEST:
      return Object.assign({}, state, {
        isFetching: true
      })
    case QUOTE_SUCCESS:
      return Object.assign({}, state, {
        isFetching: false,
        quote: action.response,
        authenticated: action.authenticated || false
      })
    case QUOTE_FAILURE:
      return Object.assign({}, state, {
        isFetching: false
      })
    default:
      return state
  }
}

// We combine the reducers here so that they
// can be left split apart above
const quotesApp = combineReducers({
  auth,
  quotes
})

export default quotesApp
```
## What is Auth0?

Auth0 helps you to:

* Add authentication with [multiple authentication sources](https://docs.auth0.com/identityproviders), either social like **Google, Facebook, Microsoft Account, LinkedIn, GitHub, Twitter, Box, Salesforce, amont others**, or enterprise identity systems like **Windows Azure AD, Google Apps, Active Directory, ADFS or any SAML Identity Provider**.
* Add authentication through more traditional **[username/password databases](https://docs.auth0.com/mysql-connection-tutorial)**.
* Add support for **[linking different user accounts](https://docs.auth0.com/link-accounts)** with the same user.
* Support for generating signed [Json Web Tokens](https://docs.auth0.com/jwt) to call your APIs and **flow the user identity** securely.
* Analytics of how, when and where users are logging in.
* Pull data from other sources and add it to the user profile, through [JavaScript rules](https://docs.auth0.com/rules).

## Create a Free Auth0 Account

1. Go to [Auth0](https://auth0.com) and click Sign Up.
2. Use Google, GitHub or Microsoft Account to login.

## Issue Reporting

If you have found a bug or if you have a feature request, please report them at this repository issues section. Please do not report security vulnerabilities on the public GitHub issue tracker. The [Responsible Disclosure Program](https://auth0.com/whitehat) details the procedure for disclosing security issues.

## Author

[Auth0](https://auth0.com)

## License

This project is licensed under the MIT license. See the [LICENSE](LICENSE) file for more info.
