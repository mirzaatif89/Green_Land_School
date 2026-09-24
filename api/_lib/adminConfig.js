function getAdminCredentialsFromEnv() {
    const username = String(process.env.ADMIN_USERNAME || '').trim();
    const password = String(process.env.ADMIN_PASSWORD || '');
    if (!username || !password) {
        const error = new Error('Set ADMIN_USERNAME and ADMIN_PASSWORD in the application environment.');
        error.statusCode = 503;
        throw error;
    }
    return { username, password };
}

module.exports = { getAdminCredentialsFromEnv };
