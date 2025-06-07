/**
 * 單則聊天訊息
 */
export interface ChatMessage {
    /** 訊息角色（使用者或模型） */
    role: "user" | "model"; // 訊息角色，使用者或模型
    /** 訊息內容 */
    text: string; // 訊息內容
}

/**
 * 生成式模型介面
 */
export interface GenerativeModel {
    /**
     * 啟動聊天會話
     * @param config 聊天會話設定
     */
    startChat(config: ChatSessionConfig): ChatSession; // 啟動新的聊天會話
}

/**
 * 聊天會話介面
 */
export interface ChatSession {
    /**
     * 傳送訊息並取得回應
     * @param prompt 提示文字
     */
    sendMessage(prompt: string): Promise<ChatResponse>;
}

/**
 * 聊天會話設定
 */
export interface ChatSessionConfig {
    /** 歷史訊息 */
    history: ChatMessage[];
    /** 生成相關設定 */
    generationConfig: {
        /** 最大輸出 token 數 */
        maxOutputTokens: number;
    };
}

/**
 * 聊天回應
 */
export interface ChatResponse {
    response: {
        /**
         * 取得回應文字
         */
        text(): string; // 取得回應文字
    };
}
