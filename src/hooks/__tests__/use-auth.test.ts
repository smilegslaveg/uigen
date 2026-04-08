import { test, expect, describe, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth } from "@/hooks/use-auth";

// --- module mocks ---

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

// Import the mocked modules so we can configure them per-test
import { signIn as signInAction, signUp as signUpAction } from "@/actions";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";
import { getAnonWorkData, clearAnonWork } from "@/lib/anon-work-tracker";

beforeEach(() => {
  vi.clearAllMocks();

  // Default: no anonymous work, no existing projects, new project created
  vi.mocked(getAnonWorkData).mockReturnValue(null);
  vi.mocked(getProjects).mockResolvedValue([]);
  vi.mocked(createProject).mockResolvedValue({ id: "new-project-id" } as any);
});

describe("useAuth — initial state", () => {
  test("isLoading starts as false", () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isLoading).toBe(false);
  });

  test("exposes signIn and signUp functions", () => {
    const { result } = renderHook(() => useAuth());
    expect(typeof result.current.signIn).toBe("function");
    expect(typeof result.current.signUp).toBe("function");
  });
});

describe("useAuth — signIn", () => {
  test("sets isLoading to true during sign-in and false after", async () => {
    let resolveSignIn!: (value: { success: boolean }) => void;
    const pendingSignIn = new Promise<{ success: boolean }>((r) => {
      resolveSignIn = r;
    });
    vi.mocked(signInAction).mockReturnValue(pendingSignIn as any);

    const { result } = renderHook(() => useAuth());

    // Start sign-in but don't await — keeps the promise pending
    act(() => {
      result.current.signIn("user@example.com", "password123");
    });

    // React has flushed the setIsLoading(true) call
    expect(result.current.isLoading).toBe(true);

    // Resolve and wait for the rest of the flow
    await act(async () => {
      resolveSignIn({ success: false });
    });

    expect(result.current.isLoading).toBe(false);
  });

  test("returns success result on valid credentials", async () => {
    vi.mocked(signInAction).mockResolvedValue({ success: true });

    const { result } = renderHook(() => useAuth());
    let returnValue: any;

    await act(async () => {
      returnValue = await result.current.signIn("user@example.com", "password123");
    });

    expect(returnValue).toEqual({ success: true });
  });

  test("returns error result on invalid credentials", async () => {
    vi.mocked(signInAction).mockResolvedValue({
      success: false,
      error: "Invalid credentials",
    });

    const { result } = renderHook(() => useAuth());
    let returnValue: any;

    await act(async () => {
      returnValue = await result.current.signIn("user@example.com", "wrongpass");
    });

    expect(returnValue).toEqual({ success: false, error: "Invalid credentials" });
    expect(mockPush).not.toHaveBeenCalled();
  });

  test("redirects to existing project after successful sign-in", async () => {
    vi.mocked(signInAction).mockResolvedValue({ success: true });
    vi.mocked(getProjects).mockResolvedValue([
      { id: "existing-project", name: "My Design", createdAt: new Date(), updatedAt: new Date() },
    ]);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("user@example.com", "password123");
    });

    expect(mockPush).toHaveBeenCalledWith("/existing-project");
  });

  test("creates a new project and redirects when user has no projects", async () => {
    vi.mocked(signInAction).mockResolvedValue({ success: true });
    vi.mocked(getProjects).mockResolvedValue([]);
    vi.mocked(createProject).mockResolvedValue({ id: "fresh-project" } as any);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("user@example.com", "password123");
    });

    expect(createProject).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/fresh-project");
  });

  test("saves anonymous work as a project after sign-in", async () => {
    vi.mocked(signInAction).mockResolvedValue({ success: true });
    vi.mocked(getAnonWorkData).mockReturnValue({
      messages: [{ role: "user", content: "build a button" }],
      fileSystemData: { "/App.jsx": "code" },
    });
    vi.mocked(createProject).mockResolvedValue({ id: "anon-project" } as any);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("user@example.com", "password123");
    });

    expect(createProject).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [{ role: "user", content: "build a button" }],
        data: { "/App.jsx": "code" },
      })
    );
    expect(clearAnonWork).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/anon-project");
  });

  test("does not save anonymous work when messages array is empty", async () => {
    vi.mocked(signInAction).mockResolvedValue({ success: true });
    vi.mocked(getAnonWorkData).mockReturnValue({
      messages: [],
      fileSystemData: {},
    });
    vi.mocked(getProjects).mockResolvedValue([
      { id: "p1", name: "Project", createdAt: new Date(), updatedAt: new Date() },
    ]);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("user@example.com", "password123");
    });

    // getProjects path taken, not createProject with anon data
    expect(mockPush).toHaveBeenCalledWith("/p1");
  });

  test("isLoading returns to false even when sign-in throws", async () => {
    vi.mocked(signInAction).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      try {
        await result.current.signIn("user@example.com", "password123");
      } catch {
        // swallow
      }
    });

    expect(result.current.isLoading).toBe(false);
  });
});

describe("useAuth — signUp", () => {
  test("sets isLoading to true during sign-up and false after", async () => {
    let resolveSignUp!: (value: { success: boolean }) => void;
    const pendingSignUp = new Promise<{ success: boolean }>((r) => {
      resolveSignUp = r;
    });
    vi.mocked(signUpAction).mockReturnValue(pendingSignUp as any);

    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.signUp("new@example.com", "password123");
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveSignUp({ success: false });
    });

    expect(result.current.isLoading).toBe(false);
  });

  test("returns success result on valid registration", async () => {
    vi.mocked(signUpAction).mockResolvedValue({ success: true });

    const { result } = renderHook(() => useAuth());
    let returnValue: any;

    await act(async () => {
      returnValue = await result.current.signUp("new@example.com", "password123");
    });

    expect(returnValue).toEqual({ success: true });
  });

  test("returns error result on duplicate email", async () => {
    vi.mocked(signUpAction).mockResolvedValue({
      success: false,
      error: "Email already in use",
    });

    const { result } = renderHook(() => useAuth());
    let returnValue: any;

    await act(async () => {
      returnValue = await result.current.signUp("existing@example.com", "password123");
    });

    expect(returnValue.success).toBe(false);
    expect(returnValue.error).toBeDefined();
    expect(mockPush).not.toHaveBeenCalled();
  });

  test("redirects to new project after successful sign-up", async () => {
    vi.mocked(signUpAction).mockResolvedValue({ success: true });
    vi.mocked(getProjects).mockResolvedValue([]);
    vi.mocked(createProject).mockResolvedValue({ id: "brand-new" } as any);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signUp("new@example.com", "password123");
    });

    expect(mockPush).toHaveBeenCalledWith("/brand-new");
  });

  test("isLoading returns to false even when sign-up throws", async () => {
    vi.mocked(signUpAction).mockRejectedValue(new Error("Server error"));

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      try {
        await result.current.signUp("new@example.com", "password123");
      } catch {
        // swallow
      }
    });

    expect(result.current.isLoading).toBe(false);
  });
});
