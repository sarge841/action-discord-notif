import { run } from '../src/main.js';
import axios from 'axios';
import { jest } from '@jest/globals';

jest.mock('axios');

describe('run', () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...OLD_ENV };
    });

    afterEach(() => {
        process.env = OLD_ENV;
    });

    it('should exit with error if webhook URL is missing', async () => {
        process.env.INPUT_WEBHOOK_URL = '';
        console.error = jest.fn();

        await expect(run()).rejects.toThrow();
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining('❌ No webhook URL provided!'));
    });

    it('should exit with error if both content and embed description are provided', async () => {
        process.env.INPUT_WEBHOOK_URL = 'https://discord.com/api/webhooks/test';
        process.env.INPUT_CONTENT = 'Test content';
        process.env.INPUT_EMBED_DESCRIPTION = 'Test embed description';
        console.error = jest.fn();

        await expect(run()).rejects.toThrow();
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining('❌ Both content and embed description provided!'));
    });

    it('should exit with error if content exceeds 2000 characters', async () => {
        process.env.INPUT_WEBHOOK_URL = 'https://discord.com/api/webhooks/test';
        process.env.INPUT_CONTENT = 'a'.repeat(2001);
        console.error = jest.fn();

        await expect(run()).rejects.toThrow();
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining('❌ Content exceeds 2000 characters!'));
    });

    it('should send a message with content', async () => {
        process.env.INPUT_WEBHOOK_URL = 'https://discord.com/api/webhooks/test';
        process.env.INPUT_CONTENT = 'Test content';
        axios.post.mockResolvedValue({ status: 204 });

        await run();

        expect(axios.post).toHaveBeenCalledWith('https://discord.com/api/webhooks/test', {
            content: 'Test content'
        });
    });

    it('should send a message with embed', async () => {
        process.env.INPUT_WEBHOOK_URL = 'https://discord.com/api/webhooks/test';
        process.env.INPUT_EMBED_TITLE = 'Test title';
        process.env.INPUT_EMBED_DESCRIPTION = 'Test description';
        axios.post.mockResolvedValue({ status: 204 });

        await run();

        expect(axios.post).toHaveBeenCalledWith('https://discord.com/api/webhooks/test', {
            embeds: [{
                title: 'Test title',
                description: 'Test description'
            }]
        });
    });

    it('should log the payload if show_payload is true', async () => {
        process.env.INPUT_WEBHOOK_URL = 'https://discord.com/api/webhooks/test';
        process.env.INPUT_CONTENT = 'Test content';
        process.env.INPUT_SHOW_PAYLOAD = 'true';
        console.info = jest.fn();
        axios.post.mockResolvedValue({ status: 204 });

        await run();

        expect(console.info).toHaveBeenCalledWith(expect.stringContaining('📢 Payload:'));
    });
});
