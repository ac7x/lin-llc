import memjs from "memjs";

const memcachedClient = memjs.Client.create(process.env.MEMCACHED_URL || "", {
    username: process.env.MEMCACHED_USERNAME || undefined,
    password: process.env.MEMCACHED_PASSWORD || undefined,
});

export default memcachedClient;
