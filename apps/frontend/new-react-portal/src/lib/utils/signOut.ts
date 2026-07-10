'use client';

export default async function signOut() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
        console.error('Logout failed:', error);
    } finally {
        window.location.href = '/';
    }
}
