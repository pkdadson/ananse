import type { Employee } from "@ananse/core";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OrgChart } from "../src/OrgChart.js";

const data: Employee[] = [
  { id: "ceo", name: "Ada Lovelace", title: "CEO", managerId: null },
  { id: "vp", name: "Grace Hopper", title: "VP Eng", managerId: "ceo" },
];

describe('<OrgChart mode="view">', () => {
  it("renders both employees", () => {
    render(<OrgChart data={data} mode="view" />);
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("Grace Hopper")).toBeInTheDocument();
  });
});
