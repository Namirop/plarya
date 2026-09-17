import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";

import { csrfTokenIssuer, csrfValidator } from "./csrf";

function mockReq(opts: {
  method?: string;
  cookies?: Record<string, string>;
  headers?: Record<string, string | string[]>;
}): Request {
  return {
    method: opts.method ?? "POST",
    cookies: opts.cookies ?? {},
    headers: opts.headers ?? {},
  } as unknown as Request;
}

function mockRes() {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
    cookie: vi.fn(),
  };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res;
}

function run(middleware: typeof csrfValidator, req: Request) {
  const res = mockRes();
  const next = vi.fn() as unknown as NextFunction & ReturnType<typeof vi.fn>;
  middleware(req, res as unknown as Response, next);
  return { res, next };
}

describe("csrfValidator", () => {
  it("laisse passer GET / HEAD / OPTIONS sans token", () => {
    for (const method of ["GET", "HEAD", "OPTIONS"]) {
      const { res, next } = run(csrfValidator, mockReq({ method }));
      expect(next).toHaveBeenCalledOnce();
      expect(res.status).not.toHaveBeenCalled();
    }
  });

  it("répond 403 sur une requête mutante sans cookie, sans header ou avec header ≠ cookie", () => {
    const cases = [
      mockReq({ headers: { "x-csrf-token": "abc" } }),
      mockReq({ cookies: { csrf_token: "abc" } }),
      mockReq({ cookies: { csrf_token: "abc" }, headers: { "x-csrf-token": "abd" } }),
    ];
    for (const req of cases) {
      const { res, next } = run(csrfValidator, req);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: expect.any(String) });
      expect(next).not.toHaveBeenCalled();
    }
  });

  it("accepte header === cookie (y compris header multi-valué : 1re valeur)", () => {
    const single = run(
      csrfValidator,
      mockReq({
        method: "DELETE",
        cookies: { csrf_token: "tok" },
        headers: { "x-csrf-token": "tok" },
      }),
    );
    expect(single.next).toHaveBeenCalledOnce();

    const multi = run(
      csrfValidator,
      mockReq({ cookies: { csrf_token: "tok" }, headers: { "x-csrf-token": ["tok", "autre"] } }),
    );
    expect(multi.next).toHaveBeenCalledOnce();
    expect(multi.res.status).not.toHaveBeenCalled();
  });
});

describe("csrfTokenIssuer", () => {
  it("pose un token hex de 32 octets non-httpOnly et hydrate req.cookies", () => {
    const req = mockReq({ method: "GET" });
    const { res, next } = run(csrfTokenIssuer, req);

    expect(res.cookie).toHaveBeenCalledOnce();
    const [name, token, options] = res.cookie.mock.calls[0];
    expect(name).toBe("csrf_token");
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(options).toMatchObject({ httpOnly: false, path: "/" });
    expect(req.cookies.csrf_token).toBe(token);
    expect(next).toHaveBeenCalledOnce();
  });

  it("ne régénère pas un token déjà présent", () => {
    const req = mockReq({ method: "GET", cookies: { csrf_token: "existant" } });
    const { res, next } = run(csrfTokenIssuer, req);

    expect(res.cookie).not.toHaveBeenCalled();
    expect(req.cookies.csrf_token).toBe("existant");
    expect(next).toHaveBeenCalledOnce();
  });
});
