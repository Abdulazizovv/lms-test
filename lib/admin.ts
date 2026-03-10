export function isAdminRequest(request: Request): boolean {
  const expected = (process.env.ADMIN_PASSWORD ?? "admin123").trim();
  const provided = (request.headers.get("x-admin-password") ?? "").trim();
  return Boolean(expected) && provided === expected;
}

