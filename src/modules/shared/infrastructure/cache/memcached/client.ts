// memcached.client.ts
import Memcached from 'memcached';

// 初始化客戶端，預設連接本機的 Memcached 服務
const memcached = new Memcached('localhost:11211');

// 測試設定與取得值
memcached.set('greeting', 'Hello Memcached!', 10, function (err) {
  if (err) console.error('Set failed:', err);
  else {
    memcached.get('greeting', function (err, data) {
      if (err) console.error('Get failed:', err);
      else console.log('Got from cache:', data);
    });
  }
});

export default memcached;
