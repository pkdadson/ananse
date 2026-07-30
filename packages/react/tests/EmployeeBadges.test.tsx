import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmployeeBadges } from "../src/nodes/EmployeeBadges.js";

describe("EmployeeBadges", () => {
  it("renders nothing when no badge fields", () => {
    const { container } = render(<EmployeeBadges data={{ id: "1", name: "Ada Lovelace" }} />);
    const root = container.querySelector("[data-ananse-badges]");
    expect(root).not.toBeNull();
    expect(root?.childElementCount).toBe(0);
  });

  it("shows remote workMode", () => {
    const { container } = render(
      <EmployeeBadges data={{ id: "1", name: "Ada Lovelace", workMode: "remote" }} />,
    );
    const root = container.querySelector("[data-ananse-badges]");
    expect(root?.textContent).toMatch(/remote/i);
  });

  it("shows contractor employmentType", () => {
    const { container } = render(
      <EmployeeBadges data={{ id: "1", name: "Ada Lovelace", employmentType: "contractor" }} />,
    );
    const root = container.querySelector("[data-ananse-badges]");
    expect(root?.textContent).toMatch(/contractor/i);
  });

  it('tenureYears shows "3y"', () => {
    const { container } = render(
      <EmployeeBadges data={{ id: "1", name: "Ada Lovelace", tenureYears: 3 }} />,
    );
    const root = container.querySelector("[data-ananse-badges]");
    expect(root?.textContent).toContain("3y");
  });
});
