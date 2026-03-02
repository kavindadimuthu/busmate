'use client';

export default async function signOut() {
    try {
        // Call the server-side logout endpoint
        const response = await fetch('/api/auth/logout', {
            method: 'GET',
        });

        if (!response.ok) {
            throw new Error('Failed to logout');
        }

        const clientId = process.env.NEXT_PUBLIC_ASGARDEO_CLIENT_ID;
        const redirect = process.env.NEXT_PUBLIC_ASGARDEO_REDIRECT_URI || 'http://localhost:3000';

        window.location.href =
            `https://api.asgardeo.io/t/busmate/oidc/logout` +
            `?post_logout_redirect_uri=${encodeURIComponent(redirect)}` +
            `&client_id=${clientId}` +
            `&state=signed_out`;

    } catch (error) {
        console.error('Logout failed:', error);
        // Fallback: redirect anyway
        window.location.href = '/';
    }
}