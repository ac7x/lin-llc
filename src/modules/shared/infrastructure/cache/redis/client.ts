import { createClient } from 'redis';

const client = createClient({ url: process.env.REDIS_URL });
client.on('error', err => console.error('Redis error:', err));
let connected = false;
async function getClient() {
    if (!connected) {
        await client.connect();
        connected = true;
    }
    return client;
}

export const redisCache = {
    async get(key: string) {
        return (await getClient()).get(key);
    },
    async set(key: string, value: string, expirationSeconds: number) {
        await (await getClient()).setEx(key, expirationSeconds, value);
    },
};