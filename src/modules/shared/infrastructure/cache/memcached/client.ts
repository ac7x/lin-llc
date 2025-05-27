import Memcached from "memcached";

const servers = (() => {
    const host = process.env.MEMCACHIER_SERVERS || "";
    const username = process.env.MEMCACHIER_USERNAME;
    const password = process.env.MEMCACHIER_PASSWORD;
    if (username && password) {
        // mc://username:password@host 格式
        return `mc://${username}:${password}@${host}`;
    }
    return host;
})();

const memcachedClient = new Memcached(servers, {
    // 可加其他 Memcached options
    // 例如 timeout: 1000
});

export default memcachedClient;
