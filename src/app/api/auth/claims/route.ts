import { NextResponse } from 'next/server';
import { adminAuth, updateUserClaims } from '@/lib/firebase-admin';
import { ROLE_HIERARCHY } from '@/utils/roleHierarchy';

export async function POST(request: Request) {
  try {
    const { uid, role, roles } = await request.json();

    // 驗證角色是否有效
    if (role && !Object.keys(ROLE_HIERARCHY).includes(role)) {
      return NextResponse.json(
        { error: '無效的角色' },
        { status: 400 }
      );
    }

    if (roles && !roles.every((r: string) => Object.keys(ROLE_HIERARCHY).includes(r))) {
      return NextResponse.json(
        { error: '包含無效的角色' },
        { status: 400 }
      );
    }

    // 更新用戶權限
    const success = await updateUserClaims(uid, {
      role,
      roles: roles || [role],
    });

    if (!success) {
      return NextResponse.json(
        { error: '更新權限失敗' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('更新權限失敗:', error);
    return NextResponse.json(
      { error: '更新權限失敗' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json(
        { error: '缺少用戶 ID' },
        { status: 400 }
      );
    }

    const user = await adminAuth.getUser(uid);
    return NextResponse.json({
      role: user.customClaims?.role,
      roles: user.customClaims?.roles,
    });
  } catch (error) {
    console.error('獲取權限失敗:', error);
    return NextResponse.json(
      { error: '獲取權限失敗' },
      { status: 500 }
    );
  }
} 