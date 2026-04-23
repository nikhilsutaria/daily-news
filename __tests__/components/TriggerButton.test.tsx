import TriggerButton from "@/components/TriggerButton";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("TriggerButton", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("renders the trigger button", () => {
    render(<TriggerButton />);

    expect(screen.getByText("Trigger Summary")).toBeInTheDocument();
  });

  it("does nothing when prompt is cancelled", async () => {
    const user = userEvent.setup();
    jest.spyOn(window, "prompt").mockReturnValue(null);

    render(<TriggerButton />);
    await user.click(screen.getByText("Trigger Summary"));

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("calls API with correct auth header on trigger", async () => {
    const user = userEvent.setup();
    jest.spyOn(window, "prompt").mockReturnValue("my-secret");
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ status: "created", message: "Success" }),
    });

    render(<TriggerButton />);
    await user.click(screen.getByText("Trigger Summary"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/trigger", {
        method: "POST",
        headers: { Authorization: "Bearer my-secret" },
      });
    });

    await waitFor(() => {
      expect(screen.getByText("Success")).toBeInTheDocument();
    });
  });

  it("shows error message on failed response", async () => {
    const user = userEvent.setup();
    jest.spyOn(window, "prompt").mockReturnValue("wrong-secret");
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Unauthorized" }),
    });

    render(<TriggerButton />);
    await user.click(screen.getByText("Trigger Summary"));

    await waitFor(() => {
      expect(screen.getByText("Unauthorized")).toBeInTheDocument();
    });
  });

  it("shows error message on network failure", async () => {
    const user = userEvent.setup();
    jest.spyOn(window, "prompt").mockReturnValue("my-secret");
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

    render(<TriggerButton />);
    await user.click(screen.getByText("Trigger Summary"));

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });
});
