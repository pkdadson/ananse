import type { Employee } from "@canvas/core";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OrgChart } from "../src/OrgChart.js";

const data: Employee[] = [
  {
    id: "ceo",
    name: "Ada Lovelace",
    title: "CEO",
    managerId: null,
    email: "ada@example.com",
    meta: { role: "executive" },
  },
];

describe("OrgChart nodeVariant", () => {
  it("renders detailed card content when nodeVariant is detailed", () => {
    render(<OrgChart data={data} mode="view" nodeVariant="detailed" />);
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
  });

  it("does not show email on default variant", () => {
    render(<OrgChart data={data} mode="view" />);
    expect(screen.queryByText("ada@example.com")).not.toBeInTheDocument();
  });
});
