import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmployeeCard } from "../src/nodes/EmployeeCard.js";

describe("EmployeeCard", () => {
  it("renders name and title", () => {
    render(<EmployeeCard data={{ id: "1", name: "Ada Lovelace", title: "Chief Engineer" }} />);
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("Chief Engineer")).toBeInTheDocument();
  });

  it("renders initials when no photoUrl is provided", () => {
    render(<EmployeeCard data={{ id: "1", name: "Ada Lovelace" }} />);
    expect(screen.getByText("AL")).toBeInTheDocument();
  });

  it("renders photo when photoUrl is provided", () => {
    render(
      <EmployeeCard
        data={{ id: "1", name: "Ada Lovelace", photoUrl: "https://example.com/a.png" }}
      />,
    );
    const img = screen.getByRole("img", { name: /Ada Lovelace/i });
    expect(img).toHaveAttribute("src", "https://example.com/a.png");
  });

  it("applies a department color chip when department is set", () => {
    const { container } = render(
      <EmployeeCard data={{ id: "1", name: "Ada", department: "engineering" }} />,
    );
    const chip = container.querySelector("[data-canvas-dept-chip]");
    expect(chip).not.toBeNull();
    expect(chip?.getAttribute("data-canvas-dept-chip")).toBe("engineering");
  });
});
