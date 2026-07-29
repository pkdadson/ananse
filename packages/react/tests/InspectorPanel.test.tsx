import type { Employee } from "@canvas/core";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { InspectorPanel } from "../src/controls/InspectorPanel.js";

const person: Employee = {
  id: "1",
  name: "Ada Lovelace",
  title: "CEO",
  email: "ada@example.com",
  managerId: null,
};

describe("InspectorPanel", () => {
  it("renders selected person fields", () => {
    render(<InspectorPanel employee={person} onChange={() => {}} onClose={() => {}} />);
    expect(screen.getByDisplayValue("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByDisplayValue("ada@example.com")).toBeInTheDocument();
  });

  it("applies a patch on submit", async () => {
    const onChange = vi.fn();
    render(<InspectorPanel employee={person} onChange={onChange} onClose={() => {}} />);
    const nameInput = screen.getByDisplayValue("Ada Lovelace");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Ada L.");
    await userEvent.click(screen.getByRole("button", { name: /apply changes/i }));
    expect(onChange).toHaveBeenCalled();
    const patch = onChange.mock.calls[0]?.[0];
    expect(patch.name).toBe("Ada L.");
  });
});
