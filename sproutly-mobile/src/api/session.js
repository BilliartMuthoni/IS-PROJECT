// Lets the API clients tell the app that the login has ended.
//
// Access tokens expire after 15 minutes and there is no refresh step yet (that comes
// with the auth redesign), so a stored token can be stale when the app reopens. When
// the backend rejects a request that carried a token (HTTP 401), the app logs out and
// returns to the login screen instead of leaving the farmer stuck on an error.

let handleExpired = null;

export function onSessionExpired(handler) {
    handleExpired = handler;
}

export function watchForExpiredSession(client) {
    client.interceptors.response.use(
        (response) => response,
        (error) => {
            const headers = error?.config?.headers;
            const sentToken = Boolean(headers?.Authorization || headers?.get?.('Authorization'));
            // A 401 without a token (e.g. a wrong password at login) is not an expired session.
            if (error?.response?.status === 401 && sentToken && handleExpired) {
                handleExpired();
            }
            return Promise.reject(error);
        }
    );
}
