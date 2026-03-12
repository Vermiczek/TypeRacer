import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";

// --- mocks ---
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

const mockSignIn = vi.fn();
const mockSignUp = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { signInWithPassword: mockSignIn, signUp: mockSignUp },
  }),
}));

vi.mock("@/app/components/ThemeToggle", () => ({
  default: () => null,
}));

import LoginPage from "./page";

// Get the submit button (not the tab button) by filtering on type="submit"
const getSubmitButton = (name: RegExp) =>
  screen
    .getAllByRole("button", { name })
    .find((b) => (b as HTMLButtonElement).type === "submit")!;

describe("LoginPage – sign-in mode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignIn.mockResolvedValue({ error: null });
    render(<LoginPage />);
  });

  it("renders sign-in form by default without username field", () => {
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.queryByLabelText("Username")).not.toBeInTheDocument();
  });

  it("shows validation error for empty email on submit", async () => {
    await userEvent.click(getSubmitButton(/sign in/i));
    await waitFor(() =>
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument()
    );
  });

  it("shows validation error for short password", async () => {
    await userEvent.type(screen.getByLabelText("Email"), "a@b.com");
    await userEvent.type(screen.getByLabelText("Password"), "abc");
    await userEvent.click(getSubmitButton(/sign in/i));
    await waitFor(() =>
      expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument()
    );
  });

  it("calls supabase signInWithPassword with form values", async () => {
    await userEvent.type(screen.getByLabelText("Email"), "user@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.click(getSubmitButton(/sign in/i));
    await waitFor(() => expect(mockSignIn).toHaveBeenCalledOnce());
    expect(mockSignIn).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "password123",
    });
  });

  it("redirects to / on successful sign-in", async () => {
    await userEvent.type(screen.getByLabelText("Email"), "user@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.click(getSubmitButton(/sign in/i));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/"));
  });

  it("shows server error on failed sign-in", async () => {
    mockSignIn.mockResolvedValue({ error: { message: "Invalid credentials" } });
    await userEvent.type(screen.getByLabelText("Email"), "user@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "wrongpass");
    await userEvent.click(getSubmitButton(/sign in/i));
    await waitFor(() =>
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument()
    );
  });
});

describe("LoginPage – sign-up mode", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockSignUp.mockResolvedValue({ error: null });
    render(<LoginPage />);
    await userEvent.click(screen.getByRole("button", { name: "Sign up" }));
  });

  it("shows username, email and password fields", () => {
    expect(screen.getByLabelText("Username")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("shows validation error for empty username on submit", async () => {
    await userEvent.click(getSubmitButton(/create account/i));
    await waitFor(() =>
      expect(screen.getByText(/at least 2 characters/i)).toBeInTheDocument()
    );
  });

  it("shows password strength bar as Strong for a complex password", async () => {
    await userEvent.type(screen.getByLabelText("Password"), "Abc123!!");
    await waitFor(() =>
      expect(screen.getByText("Strong")).toBeInTheDocument()
    );
  });

  it("shows success message after successful sign-up", async () => {
    await userEvent.type(screen.getByLabelText("Username"), "speedster42");
    await userEvent.type(screen.getByLabelText("Email"), "user@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "securePass1!");
    await userEvent.click(getSubmitButton(/create account/i));
    await waitFor(() =>
      expect(screen.getByText(/check your email/i)).toBeInTheDocument()
    );
  });
});
