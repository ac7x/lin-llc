"use client";

import { auth } from "@/lib/firebase-client";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import Image from 'next/image';
import { useFirebase } from "@/lib/firebase-context";

// SVG 圖示元件
function GoogleLogo({ style }: { style?: React.CSSProperties }) {
    return (
        <svg style={style} viewBox="0 0 24 24" width="24" height="24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
    );
}

function SignOut({ style }: { style?: React.CSSProperties }) {
    return (
        <svg style={style} fill="currentColor" viewBox="0 0 24 24" width="24" height="24">
            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
        </svg>
    );
}

function SignIn() {
    const [user, loading] = useAuthState(auth);
    const { appCheckReady, appCheckTimeout, appCheckLog, retryAppCheck } = useFirebase();

    const handleRefresh = (): void => {
        window.location.reload();
    };

    const handleGoogleSignIn = async (): Promise<void> => {
        if (!appCheckReady) {
            alert("系統正在初始化中，請稍後再試");
            return;
        }

        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("登入失敗:", error);
            alert("登入失敗，請重試");
        }
    };

    const handleSignOut = async (): Promise<void> => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("登出失敗:", error);
        }
    };

    if (loading) {
        return <div>載入中...</div>;
    }

    if (appCheckTimeout) {
        return (
            <div className="max-w-4xl mx-auto p-6 text-center">
                <div className="text-red-600 text-lg font-semibold mb-4">
                    🚫 安全性驗證載入超時
                </div>
                <div className="text-gray-600 mb-4">
                    請檢查網路連線、reCAPTCHA script 或關閉廣告阻擋程式
                </div>

                <div className="bg-white border border-red-200 rounded-lg p-4 shadow-sm">
                    <div className="text-sm text-gray-700 mb-2 font-medium">📋 詳細除錯資訊：</div>
                    <pre className="bg-gray-50 text-xs text-left p-3 rounded border overflow-x-auto"
                        style={{ whiteSpace: "pre-wrap", maxHeight: "300px" }}>
                        {appCheckLog}
                    </pre>
                </div>

                <div className="flex gap-3 justify-center mt-6">
                    <button
                        onClick={handleRefresh}
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        🔄 重新載入頁面
                    </button>
                    {retryAppCheck && (
                        <button
                            onClick={retryAppCheck}
                            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                        >
                            🔁 重試 App Check
                        </button>
                    )}
                </div>
            </div>
        );
    }

    if (!appCheckReady) {
        return (
            <div className="max-w-4xl mx-auto p-6 text-center">
                <div className="text-blue-600 text-lg font-semibold mb-4">
                    🔄 系統初始化中...
                </div>
                <div className="text-gray-600 mb-4">
                    正在驗證安全性設定，請稍候
                </div>

                <div className="bg-white border border-blue-200 rounded-lg p-4 shadow-sm">
                    <div className="text-sm text-gray-700 mb-2 font-medium">📊 初始化進度：</div>
                    <pre className="bg-blue-50 text-xs text-left p-3 rounded border overflow-x-auto"
                        style={{ whiteSpace: "pre-wrap", maxHeight: "300px" }}>
                        {appCheckLog || "正在載入..."}
                    </pre>
                </div>

                <div className="mt-4 text-sm text-gray-500">
                    💡 如果等待時間過長，可能是：reCAPTCHA 載入緩慢、網路連線問題或廣告阻擋程式干擾
                </div>
            </div>
        );
    }

    const containerStyle: React.CSSProperties = {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
        maxWidth: 400,
        margin: "auto",
        marginTop: "10vh",
        backgroundColor: "#f9f9f9",
        borderRadius: 12,
        boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
        minHeight: "60vh",
    };

    const buttonStyle: React.CSSProperties = {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "12px 24px",
        backgroundColor: "#ffffff",
        border: "1px solid #dadce0",
        borderRadius: 8,
        cursor: "pointer",
        fontSize: 16,
        fontWeight: 500,
        color: "#3c4043",
        textDecoration: "none",
        transition: "all 0.2s ease",
        width: "100%",
        maxWidth: 280,
    };

    const userStyle: React.CSSProperties = {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginBottom: 24,
        flex: 1,
        justifyContent: "center",
    };

    const imgStyle: React.CSSProperties = {
        width: 140,
        height: 140,
        borderRadius: "50%",
        marginBottom: 16,
    };

    return (
        <div style={containerStyle}>
            {user && (
                <div style={userStyle}>
                    {user.photoURL && (
                        <Image
                            src={user.photoURL}
                            alt="使用者頭像"
                            width={140}
                            height={140}
                            style={imgStyle}
                        />
                    )}
                    <strong>{user.displayName}</strong>
                    <small>{user.email}</small>
                </div>
            )}

            <button
                type="button"
                style={buttonStyle}
                onClick={user ? handleSignOut : handleGoogleSignIn}
            >
                {user ? (
                    <>
                        <SignOut style={{ fontSize: 24, marginRight: 7 }} />
                        登出
                    </>
                ) : (
                    <>
                        <GoogleLogo style={{ fontSize: 24, marginRight: 7 }} />
                        使用 Google 登入
                    </>
                )}
            </button>
        </div>
    );
}

export default SignIn;