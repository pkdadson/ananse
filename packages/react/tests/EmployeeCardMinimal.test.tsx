import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmployeeCardMinimal } from "../src/nodes/EmployeeCardMinimal.js";

describe("EmployeeCardMinimal", () => {
  it("renders name and initials only", () => {
    render(
      <EmployeeCardMinimal data={{ id: "1", name: "Ada Lovelace", title: "CEO" }} />,
    );
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("AL")).toBeInTheDocument();
    expect(screen.queryByText("CEO")).not.toBeInTheDocument();
  });
});
