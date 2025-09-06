
export function isUnauthorizedError(error: any): boolean {
  return error?.message?.includes('401') || error?.status === 401;
}
