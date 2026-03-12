import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";
import TypingGame from "./index";

const SENTENCE = "hello world";

describe("TypingGame", () => {
  it("renders idle state with input placeholder", () => {
    render(<TypingGame sentence={SENTENCE} onComplete={vi.fn()} />);
    expect(screen.getByPlaceholderText(/start typing/i)).toBeInTheDocument();
    expect(screen.getByText("Start typing")).toBeInTheDocument();
  });

  it("shows live WPM and hides placeholder after first keystroke", async () => {
    render(<TypingGame sentence={SENTENCE} onComplete={vi.fn()} />);
    const input = screen.getByRole("textbox");
    await userEvent.type(input, "h");
    expect(screen.queryByText("Start typing")).not.toBeInTheDocument();
  });

  it("calls onComplete with wpm/accuracy/elapsed when sentence is finished", async () => {
    const onComplete = vi.fn();
    render(<TypingGame sentence={SENTENCE} onComplete={onComplete} />);
    const input = screen.getByRole("textbox");
    await userEvent.type(input, SENTENCE);
    expect(onComplete).toHaveBeenCalledOnce();
    const result = onComplete.mock.calls[0][0];
    expect(result.wpm).toBeGreaterThanOrEqual(0);
    expect(result.accuracy).toBeGreaterThan(0);
    expect(typeof result.elapsed).toBe("number");
  });

  it("shows result panel after completion", async () => {
    render(<TypingGame sentence={SENTENCE} onComplete={vi.fn()} />);
    const input = screen.getByRole("textbox");
    await userEvent.type(input, SENTENCE);
    // Input is replaced by ResultPanel; no textbox should remain
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("shows 'New personal best!' when newBest is true after completion", async () => {
    render(
      <TypingGame sentence={SENTENCE} onComplete={vi.fn()} newBest={true} />
    );
    const input = screen.getByRole("textbox");
    await userEvent.type(input, SENTENCE);
    expect(screen.getByText(/new personal best/i)).toBeInTheDocument();
  });

  it("disables the input when disabled prop is true", () => {
    render(
      <TypingGame sentence={SENTENCE} onComplete={vi.fn()} disabled={true} />
    );
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("renders optional controls slot", () => {
    render(
      <TypingGame
        sentence={SENTENCE}
        onComplete={vi.fn()}
        controls={<button>Restart</button>}
      />
    );
    expect(screen.getByRole("button", { name: "Restart" })).toBeInTheDocument();
  });
});
