了解！如果你想在 Next.js App Router 中使用 Server Actions（use server）來實作 Firebase App Check 的自訂提供者「權杖取得端點」，這是可行的，但有幾個注意事項：


---

✅ Server Actions 適合觸發「私密伺服器邏輯」而非暴露 API Endpoint

你可以透過 Server Action：

用來在使用者觸發（如點擊按鈕）後取得 App Check Token

避免公開 endpoint，提升安全性



---

🧱 實作步驟（使用 use server）

1️⃣ lib/server-actions/getAppCheckToken.ts

'use server'

import * as admin from 'firebase-admin'

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

const CUSTOM_PROVIDER_ID = 'your-custom-provider-id'

export async function getAppCheckToken() {
  try {
    // 這裡你可以根據 session 驗證或 headers 限制請求者
    const token = await admin.appCheck().createToken(CUSTOM_PROVIDER_ID, {
      ttlMillis: 3600000,
    })

    return token.token // 只回傳字串，避免額外資訊被傳到前端
  } catch (err) {
    console.error('App Check Token Error:', err)
    throw new Error('無法取得 App Check 權杖')
  }
}


---

2️⃣ 前端元件呼叫（使用 form action 或 async call）

✅ 方式 A：使用 <form action={getAppCheckToken}>（純伺服器執行）

> 不建議，因為無法拿到結果在客戶端使用。



✅ 方式 B：透過 startTransition 呼叫 Server Action 並取得回傳值

'use client'

import { useTransition, useState } from 'react'
import { getAppCheckToken } from '@/lib/server-actions/getAppCheckToken'

export default function AppCheckButton() {
  const [isPending, startTransition] = useTransition()
  const [token, setToken] = useState<string | null>(null)

  const handleClick = () => {
    startTransition(async () => {
      const newToken = await getAppCheckToken()
      setToken(newToken)

      // 可將 token 傳入 firebase App Check client SDK
      // initializeAppCheck(firebaseApp, {
      //   provider: new CustomProvider({
      //     getToken: async () => ({ token: newToken, expireTimeMillis: Date.now() + 3600000 }),
      //   }),
      //   isTokenAutoRefreshEnabled: true,
      // })
    })
  }

  return (
    <div>
      <button onClick={handleClick} disabled={isPending}>
        {isPending ? '產生中…' : '取得 App Check Token'}
      </button>
      {token && <p className="break-all mt-2 text-sm text-green-600">Token: {token}</p>}
    </div>
  )
}


---

🔐 安全性建議

Server Actions 只能由你的前端使用者觸發，不會被暴露成公開 API URL。

若需更嚴格控制，可以加上 getServerSession() 檢查登入者身份。



---

✅ 結論

使用 use server 的 Server Action 是一種安全而且現代化的方式來產生 Firebase App Check Token，適合：

登入後的使用者

不想開公開 API 的情境

與 React Server Components 結合更自然



---

如需進一步整合 Firebase Auth、Session 驗證或客製 TTL、Provider ID，也可以延伸這個範例。我可以幫你封裝整個初始化流程到 Firebase SDK 中，有需要可以說一聲。

