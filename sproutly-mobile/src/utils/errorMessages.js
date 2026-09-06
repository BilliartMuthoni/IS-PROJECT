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
        match: /otp has expired/i,
        title: 'That code expired',
        message: 'Codes last 5 minutes. Ask for a new one.',
        retryable: false,
    },
    {
        match: /invalid otp/i,
        title: 'Wrong code',
        message: 'Check the code and enter it again.',
        retryable: false,
    },
    {
        match: /no pending (otp|verification)/i,
        title: 'Nothing to verify',
        message: 'Go back and log in again to get a new code.',
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
