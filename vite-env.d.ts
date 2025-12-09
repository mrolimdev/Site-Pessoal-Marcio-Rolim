/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_GEMINI_API_KEY: string;
    readonly VITE_MINIMAX_API_KEY: string;
    readonly VITE_MINIMAX_GROUP_ID: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
