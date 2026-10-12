// Turns technical failures into something a farmer can act on.
// Every message should answer: what happened, and what do I do now?

const PATTERNS = [
    {
        match: /network error|econnaborted|timed out|timeout/i,
        title: "Can't reach Sproutly",
        message: 'Check that you have internet, then try again.',
        retryable: true,
    },
    {
        match: /invalid credentials/i,
        title: 'That did not match',
        message: 'The phone number or password is wrong. Check them and try again.',
        retryable: false,
    },
    {
        match: /already exists/i,
        title: 'Account already exists',
        message: 'This number is already registered. Try logging in instead.',
        retryable: false,
    },
    {
        match: /rate limit|too many/i,
        title: 'Too many tries',
        message: 'Wait a minute before trying again.',
        retryable: false,
    },
    {
        match: /wrong or expired code/i,
        title: 'That code did not work',
        message: 'The code changes every 30 seconds. Enter the one showing now in your authenticator app.',
        retryable: false,
    },
    {
        match: /code must be the 6 digits/i,
        title: 'Enter all 6 digits',
        message: 'Type the 6-digit code shown under Sproutly in your authenticator app.',
        retryable: false,
    },
    {
        match: /step has expired/i,
        title: 'This took too long',
        message: 'For your security, go back and log in again.',
        retryable: false,
    },
    {
        match: /not a jpeg|could not be read|dimensions are too large|file is empty/i,
        title: 'That photo would not work',
        message: 'Take the photo again with your camera and try once more.',
        retryable: false,
    },
    {
        match: /too large/i,
        title: 'Photo is too big',
        message: 'Take a new photo with the camera instead of using a large saved file.',
        retryable: false,
    },
    {
        match: /not authenticated|401/i,
        title: 'Please log in again',
        message: 'Your session has ended for security. Log in to continue.',
        retryable: false,
    },
];

export function toFriendlyError(error) {
    const raw = typeof error === 'string' ? error : error?.message || '';

    for (const entry of PATTERNS) {
        if (entry.match.test(raw)) {
            return { title: entry.title, message: entry.message, retryable: entry.retryable };
        }
    }

    return {
        title: 'Something went wrong',
        message: raw || 'Please try again in a moment.',
        retryable: true,
    };
}
