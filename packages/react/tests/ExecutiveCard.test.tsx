import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExecutiveCard } from "../src/nodes/ExecutiveCard.js";

describe("ExecutiveCard", () => {
  it("renders name and title", () => {
    render(<ExecutiveCard data={{ id: "1", name: "Tim Berners-Lee", title: "CEO" }} />);
    expect(screen.getByText("Tim Berners-Lee")).toBeInTheDocument();
    expect(screen.getByText("CEO")).toBeInTheDocument();
  });

  it("applies executive visual role attribute", () => {
    const { container } = render(<ExecutiveCard data={{ id: "1", name: "Tim" }} />);
    expect(container.querySelector('[data-canvas-role="executive"]')).not.toBeNull();
  });
});
