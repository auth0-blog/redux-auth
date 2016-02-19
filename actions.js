// The middleware to call the API for quotes
import { CALL_API } from './middleware/api'


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

// Opens the Lock widget and
// dispatches actions along the way
export function login() {
  const lock = new Auth0Lock('YOUR_CLIENT_ID', 'YOUR_CLIENT_DOMAIN');
  return dispatch => {
    lock.show((err, profile, token) => {
      if(err) {
        dispatch(lockError(err))
        return
      }
      localStorage.setItem('profile', JSON.stringify(profile))
      localStorage.setItem('id_token', token)
      dispatch(lockSuccess(profile, token))
    })
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


// Logs the user out
export function logoutUser() {
  return dispatch => {
    dispatch(requestLogout())
    localStorage.removeItem('id_token')
    dispatch(receiveLogout())
  }
}


export const QUOTE_REQUEST = 'QUOTE_REQUEST'
export const QUOTE_SUCCESS = 'QUOTE_SUCCESS'
export const QUOTE_FAILURE = 'QUOTE_FAILURE'

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