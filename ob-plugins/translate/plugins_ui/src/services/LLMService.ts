/**
 * Base LLM service interface
 */

export interface StreamChunk {
    content: string;
    done: boolean;
    error?: string;
}

export interface LLMMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface LLMService {
    /**
     * Stream response from LLM
     * @param messages - Conversation messages
     * @returns AsyncGenerator yielding text chunks
     */
    streamResponse(messages: LLMMessage[]): AsyncGenerator<string>;

    /**
     * Validate service settings
     * @returns true if settings are valid
     */
    validateSettings(): boolean;

    /**
     * Get last error message
     */
    getLastError(): string | null;

    /**
     * Abort the current streaming request
     */
    abort?(): void;
}
