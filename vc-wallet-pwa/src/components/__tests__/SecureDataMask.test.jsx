import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SecureDataMask from "../SecureDataMask";

describe("SecureDataMask", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it("renders masked by default", () => {
    render(<SecureDataMask value="234567891234" label="Aadhaar number" />);

    const value = screen.getByTestId("secure-value");
    expect(value).toHaveTextContent("XXXX-XXXX-1234");
    expect(value).not.toHaveTextContent("234567891234");
  });

  it("reveals the full value when the reveal button is clicked", async () => {
    // userEvent's internal timers must be advanced manually when using fake timers.
    const user = userEvent.setup({ delay: null });
    render(<SecureDataMask value="234567891234" label="Aadhaar number" />);

    const button = screen.getByRole("button", { name: /tap to reveal aadhaar number/i });
    await user.click(button);

    expect(screen.getByTestId("secure-value")).toHaveTextContent("234567891234");
    expect(screen.getByRole("button", { name: /hide aadhaar number/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /hide aadhaar number/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("automatically re-masks the data after 10 seconds and clears it from state", async () => {
    const user = userEvent.setup({ delay: null });
    render(<SecureDataMask value="234567891234" label="Aadhaar number" />);

    await user.click(screen.getByRole("button", { name: /tap to reveal/i }));
    expect(screen.getByTestId("secure-value")).toHaveTextContent("234567891234");

    // Fast-forward exactly 10 seconds. Wrapped in act() because the timer
    // callback triggers a React state update (setIsRevealed(false)).
    act(() => {
      jest.advanceTimersByTime(10_000);
    });

    expect(screen.getByTestId("secure-value")).toHaveTextContent("XXXX-XXXX-1234");
    expect(screen.getByTestId("secure-value")).not.toHaveTextContent("234567891234");
    expect(screen.getByRole("button", { name: /tap to reveal aadhaar number/i })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });

  it("does not re-mask before the 10 second window elapses", async () => {
    const user = userEvent.setup({ delay: null });
    render(<SecureDataMask value="234567891234" label="Aadhaar number" />);

    await user.click(screen.getByRole("button", { name: /tap to reveal/i }));
    act(() => {
      jest.advanceTimersByTime(9_999);
    });

    expect(screen.getByTestId("secure-value")).toHaveTextContent("234567891234");
  });

  it("allows manually hiding before the timeout and clears the pending timer", async () => {
    const user = userEvent.setup({ delay: null });
    render(<SecureDataMask value="234567891234" label="Aadhaar number" />);

    await user.click(screen.getByRole("button", { name: /tap to reveal/i }));
    await user.click(screen.getByRole("button", { name: /hide/i }));

    expect(screen.getByTestId("secure-value")).toHaveTextContent("XXXX-XXXX-1234");

    // Even after the original 10s window, nothing should throw / re-trigger.
    jest.advanceTimersByTime(10_000);
    expect(screen.getByTestId("secure-value")).toHaveTextContent("XXXX-XXXX-1234");
  });

  it("is keyboard-navigable via Tab and Enter", async () => {
    const user = userEvent.setup({ delay: null });
    render(<SecureDataMask value="234567891234" label="Aadhaar number" />);

    await user.tab();
    expect(screen.getByRole("button", { name: /tap to reveal/i })).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(screen.getByTestId("secure-value")).toHaveTextContent("234567891234");
  });

  it("announces state changes via an ARIA live region for screen readers", async () => {
    const user = userEvent.setup({ delay: null });
    render(<SecureDataMask value="234567891234" label="Aadhaar number" />);

    const liveRegion = screen.getByRole("status");
    expect(liveRegion).toHaveTextContent(/hidden/i);

    await user.click(screen.getByRole("button", { name: /tap to reveal/i }));
    expect(liveRegion).toHaveTextContent(/revealed/i);
  });
});
