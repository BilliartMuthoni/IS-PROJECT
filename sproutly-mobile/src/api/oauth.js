// "Continue with GitHub" on the phone: the app's half of the backend's OAuth flow
// (see sproutly-backend/app/routers/oauth.py).
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as Crypto from 'expo-crypto';
import { API_BASE_URL } from '../constants/api';
import { exchangeOAuthCode } from './AuthService';

const toHex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
const toBase64Url = (base64) => base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/**
 * PKCE (RFC 7636): a random verifier that never leaves the phone until the very end,
 * and its SHA-256 hash (the challenge), which goes out first. A login code stolen on
 * the way back is useless without the verifier.
 */
async function makePkce() {
    const verifier = toHex(Crypto.getRandomBytes(32)); // 64 characters, allowed by RFC 7636
    const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, verifier, {
        encoding: Crypto.CryptoEncoding.BASE64,
    });
    return { verifier, challenge: toBase64Url(digest) };
}

/**
 * Open the provider's sign-in page in a secure browser tab and finish the sign-in.
 * Resolves to the backend's answer ({ tokens } or { challenge }), or null if the
 * person closed the page or pressed Cancel.
 */
export async function signInWith(provider) {
    const { verifier, challenge } = await makePkce();
    // Where the backend sends the browser back to: exp://<laptop>:8081/--/oauth in Expo Go.
    const returnUrl = Linking.createURL('oauth');
    const startUrl =
        `${API_BASE_URL}/auth/oauth/${provider}/start` +
        `?redirect_uri=${encodeURIComponent(returnUrl)}&code_challenge=${encodeURIComponent(challenge)}`;

    // Android: by default Expo launches the tab through a proxy activity that keeps it alive
    // after the person leaves it, so an unfinished sign-in resurfaces on the next tap (even on
    // the other provider's button). Without the proxy the tab opens with "no history": it
    // closes as soon as it is left, including when the sign-in returns to the app.
    // (createTask: false avoided the stale tab but left the finished page on top of the app.)
    const result = await WebBrowser.openAuthSessionAsync(startUrl, returnUrl, { useProxyActivity: false });
    if (result.type !== 'success') return null;

    const { queryParams } = Linking.parse(result.url);
    if (queryParams?.error === 'cancelled') return null;
    if (queryParams?.error) throw new Error(`oauth ${queryParams.error}`);
    if (!queryParams?.code) throw new Error('oauth failed');

    return exchangeOAuthCode({ code: queryParams.code, codeVerifier: verifier });
}
