import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmployeeCardCompact } from "../src/nodes/EmployeeCardCompact.js";

describe("EmployeeCardCompact", () => {
  it("renders name and title densely", () => {
    render(<EmployeeCardCompact data={{ id: "1", name: "Ada Lovelace", title: "CEO" }} />);
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("CEO")).toBeInTheDocument();
  });

  it("does not render email", () => {
    render(<EmployeeCardCompact data={{ id: "1", name: "Ada", email: "ada@example.com" }} />);
    expect(screen.queryByText("ada@example.com")).not.toBeInTheDocument();
  });
});
