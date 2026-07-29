import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VacantRoleCard } from "../src/nodes/VacantRoleCard.js";

describe("VacantRoleCard", () => {
  it("renders the title as the primary label", () => {
    render(<VacantRoleCard title="Senior Product Designer" department="design" />);
    expect(screen.getByText("Senior Product Designer")).toBeInTheDocument();
  });

  it("renders an OPEN badge and accessible open-role label", () => {
    render(<VacantRoleCard title="Senior Engineer" />);
    expect(screen.getByText("OPEN")).toBeInTheDocument();
    expect(screen.getByLabelText(/open role: senior engineer/i)).toBeInTheDocument();
  });

  it("has vacant role attribute for styling and testing", () => {
    const { container } = render(<VacantRoleCard title="TBD" />);
    expect(container.querySelector('[data-canvas-role="vacant"]')).not.toBeNull();
  });
});
