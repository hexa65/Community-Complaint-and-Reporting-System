import { render, screen } from "@testing-library/react";
import App from "@/App";

describe("App", () => {
  it("renders the CivicTrack heading and the three statuses", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "CivicTrack" })).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("Resolved")).toBeInTheDocument();
  });
});