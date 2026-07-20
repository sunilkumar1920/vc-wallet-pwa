import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginScreen from "../LoginScreen";

describe("LoginScreen", () => {
  it("does not call onLogin with empty fields and shows an error", async () => {
    const user = userEvent.setup();
    const onLogin = jest.fn();
    render(<LoginScreen onLogin={onLogin} />);

    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(onLogin).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("calls onLogin with the entered username once both fields are filled", async () => {
    const user = userEvent.setup();
    const onLogin = jest.fn();
    render(<LoginScreen onLogin={onLogin} />);

    await user.type(screen.getByLabelText(/username/i), "test");
    await user.type(screen.getByLabelText(/password/i), "test");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(onLogin).toHaveBeenCalledWith("test");
  });
});
