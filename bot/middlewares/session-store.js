// Simple in-memory session storage
class MemorySessionStore {
    constructor() {
        this.sessions = new Map();
    }

    async get(key) {
        console.log('session_store_get', { key, exists: this.sessions.has(key) });
        return this.sessions.get(key) || {};
    }

    async set(key, value) {
        console.log('session_store_set', { key, value });
        this.sessions.set(key, value);
    }

    async delete(key) {
        console.log('session_store_delete', { key });
        this.sessions.delete(key);
    }
}

/**
 * Create and configure session middleware
 * @param {Object} bot - Telegraf bot instance
 */
function setupSession(bot) {
    const store = new MemorySessionStore();
    
    // Session middleware
    bot.use(async (ctx, next) => {
        // Create session key from user ID
        const sessionKey = ctx.from ? `user:${ctx.from.id}` : null;
        
        if (!sessionKey) {
            return await next();
        }
        
        // Get session from store
        ctx.session = await store.get(sessionKey);
        
        // Process request
        await next();
        
        // Save session back to store
        if (ctx.session) {
            await store.set(sessionKey, ctx.session);
        } else {
            await store.delete(sessionKey);
        }
    });
}

module.exports = {
    setupSession
}; 