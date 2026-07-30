import type { Employee } from "@canvas/core";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OrgChart } from "../src/OrgChart.js";

const data: Employee[] = [
  { id: "ceo", name: "Ada Lovelace", title: "CEO", managerId: null },
  { id: "vp", name: "Grace Hopper", title: "VP Eng", managerId: "ceo" },
];

describe("OrgChart simple DX API", () => {
  it("renders with defaultData (uncontrolled)", () => {
    render(<OrgChart defaultData={data} height={400} />);
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
  });

  it("renders in edit mode without an editor prop", () => {
    const onChange = vi.fn();
    render(<OrgChart defaultData={data} mode="edit" onChange={onChange} height={400} />);
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByLabelText("Undo")).toBeInTheDocument();
    expect(screen.getByLabelText("Export JSON")).toBeInTheDocument();
  });

  it("supports fields config", () => {
    render(
      <OrgChart
        data={[
          {
            id: "ceo",
            name: "Ada Lovelace",
            title: "CEO",
            email: "ada@example.com",
            managerId: null,
          },
        ]}
        nodeVariant="detailed"
        fields={{ email: false }}
        height={400}
      />,
    );
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.queryByText("ada@example.com")).not.toBeInTheDocument();
  });
});
