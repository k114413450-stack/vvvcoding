const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  ip: string,
  limit: number = 5,       // 最多 N 次
  windowMs: number = 60_000 // 时间窗口（毫秒）
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const key = ip;
  const record = requestCounts.get(key);

  if (!record || now > record.resetAt) {
    requestCounts.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (record.count >= limit) {
    return { allowed: false, retryAfter: Math.ceil((record.resetAt - now) / 1000) };
  }

  record.count++;
  return { allowed: true };
}
