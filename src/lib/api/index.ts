import { liveApi } from './client';
import { mockApi } from './mock';

const isLive =
  import.meta.env.VITE_API_MODE === 'live' ||
  import.meta.env.NEXT_PUBLIC_API_MODE === 'live';

export const api = isLive ? liveApi : mockApi;
export const IS_MOCK_MODE = !isLive;
