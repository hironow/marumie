import { GET as GET_ACCOUNTS, POST as POST_ACCOUNTS } from "@/app/api/accounts/route";
import { DELETE as DELETE_ACCOUNT } from "@/app/api/accounts/[id]/route";

jest.mock("@/server/repositories/prisma-account.repository", () => {
  class MockPrismaAccountRepository {
    listByOrganization = jest.fn(async (_orgId: string) => [
      {
        id: "10",
        political_organization_id: "1",
        name: "メイン銀行",
        type: "bank",
        institution: "Sample Bank",
        currency: "JPY",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
    create = jest.fn(async (input: any) => ({
      id: "11",
      ...input,
      created_at: new Date(),
      updated_at: new Date(),
    }));
    delete = jest.fn(async (_id: string) => {});
  }
  return { PrismaAccountRepository: MockPrismaAccountRepository };
});

describe("/api/accounts route", () => {
  test("GET returns accounts list for org", async () => {
    const req = new Request("http://localhost/api/accounts?orgId=1");
    const res = await GET_ACCOUNTS(req as any);
    expect(res.ok).toBe(true);
    const data = (await res.json()) as any[];
    expect(Array.isArray(data)).toBe(true);
    expect(data[0].name).toBe("メイン銀行");
  });

  test("POST creates an account", async () => {
    const body = {
      political_organization_id: "1",
      name: "財布",
      type: "cash",
      currency: "JPY",
      is_active: true,
    };
    const req = new Request("http://localhost/api/accounts", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST_ACCOUNTS(req as any);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.name).toBe("財布");
  });

  test("DELETE removes an account", async () => {
    const req = new Request("http://localhost/api/accounts/11", { method: "DELETE" });
    const res = await DELETE_ACCOUNT(req as any, { params: { id: "11" } } as any);
    expect(res.ok).toBe(true);
  });
});

