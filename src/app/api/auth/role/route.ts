import { NextResponse } from 'next/server';
import { setUserRole, removeUserRole } from '@/lib/firebase-admin';
import type { RoleKey } from '@/utils/roleHierarchy';

export async function POST(request: Request) {
  try {
    const { uid, role, action } = await request.json();

    if (!uid || !role) {
      return NextResponse.json(
        { error: '缺少必要參數' },
        { status: 400 }
      );
    }

    if (action === 'set') {
      await setUserRole(uid, role as RoleKey);
    } else if (action === 'remove') {
      await removeUserRole(uid, role as RoleKey);
    } else {
      return NextResponse.json(
        { error: '無效的操作' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('設定角色失敗:', error);
    return NextResponse.json(
      { error: '設定角色失敗' },
      { status: 500 }
    );
  }
} 