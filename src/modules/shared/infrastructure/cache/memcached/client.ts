import Memcached from "memcached";

const memcachedClient = new Memcached(process.env.MEMCACHED_URL || "", {
    username: process.env.MEMCACHED_USERNAME || undefined,
    password: process.env.MEMCACHED_PASSWORD || undefined,
});

export default memcachedClient;
