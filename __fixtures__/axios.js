import { jest } from '@jest/globals';

export const axios = {
  post: jest.fn(() => Promise.resolve({ data: {} })),
};
