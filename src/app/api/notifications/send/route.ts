import { NextResponse } from 'next/server';
import { adminMessaging, adminAuth } from '@/lib/firebase-admin';
import type { NotificationMessage } from '@/types/notification';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import type { MulticastMessage, SendResponse } from 'firebase-admin/messaging';

// 通知發送限制
const RATE_LIMIT = {
  windowMs: 60 * 1000, // 1分鐘
  maxRequests: 10, // 最多10個請求
};

// 請求計數器
const requestCounts = new Map<string, { count: number; resetTime: number }>();

// 檢查請求限制
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = requestCounts.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    requestCounts.set(userId, { count: 1, resetTime: now + RATE_LIMIT.windowMs });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT.maxRequests) {
    return false;
  }

  userLimit.count++;
  return true;
}

export async function POST(request: Request) {
  try {
    // 驗證請求
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授權' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // 檢查請求限制
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { error: '請求過於頻繁，請稍後再試' },
        { status: 429 }
      );
    }

    // 解析請求內容
    const message = await request.json() as MulticastMessage;

    // 驗證必要欄位
    if (!message.notification?.title || !message.notification?.body) {
      return NextResponse.json(
        { error: '缺少必要欄位' },
        { status: 400 }
      );
    }

    // 驗證 Token 列表
    if (!message.tokens?.length) {
      return NextResponse.json(
        { error: '缺少 FCM Token' },
        { status: 400 }
      );
    }

    // 發送通知
    const response = await adminMessaging.sendEachForMulticast(message);

    // 處理失敗的 Token
    const failedTokens = response.responses
      .map((resp: SendResponse, idx: number) => {
        if (!resp.success) {
          return message.tokens[idx];
        }
        return null;
      })
      .filter((token: string | null): token is string => token !== null);

    // 如果有失敗的 Token，從用戶資料中移除
    if (failedTokens.length > 0) {
      // TODO: 實作移除失敗 Token 的邏輯
      console.log('失敗的 Token:', failedTokens);
    }

    return NextResponse.json({
      success: true,
      results: response.responses,
      failedTokens,
    });
  } catch (error) {
    console.error('發送通知失敗:', error);
    return NextResponse.json(
      { error: '發送通知失敗' },
      { status: 500 }
    );
  }
} 