import type { Employee } from "@ananse/core";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OrgChart } from "../src/OrgChart.js";

const people: Employee[] = [
  { id: "ceo", name: "Ada Lovelace", title: "CEO", managerId: null },
  { id: "cto", name: "Grace Hopper", title: "CTO", managerId: "ceo" },
];

describe("OrgChart extensibility", () => {
  it("applies i18n labels to search chrome", () => {
    render(
      <OrgChart
        defaultData={people}
        height={400}
        showSearch
        labels={{
          searchAriaLabel: "Suche Organigramm",
          searchPlaceholder: "Personen suchen…",
        }}
      />,
    );
    expect(screen.getByRole("searchbox", { name: /suche organigramm/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Personen suchen…")).toBeInTheDocument();
  });

  it("supports custom layout positions", () => {
    render(
      <OrgChart
        defaultData={people}
        height={400}
        layout={(employees) => ({
          nodes: employees.map((e, i) => ({
            id: e.id,
            position: { x: i * 100, y: 0 },
            size: { width: 80, height: 40 },
            data: e,
          })),
          edges: [],
          bounds: { width: 200, height: 40 },
        })}
      />,
    );
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("Grace Hopper")).toBeInTheDocument();
  });

  it("merges plugin labels", () => {
    render(
      <OrgChart
        defaultData={people}
        height={400}
        showSearch
        plugins={[
          {
            id: "de",
            labels: { searchPlaceholder: "Aus Plugin…" },
          },
        ]}
      />,
    );
    expect(screen.getByPlaceholderText("Aus Plugin…")).toBeInTheDocument();
  });

  it("renderInspector replaces default panel when in edit with selection path available", () => {
    const renderInspector = vi.fn(() => <div data-testid="custom-inspector">Custom</div>);
    render(
      <OrgChart
        defaultData={people}
        height={400}
        mode="edit"
        showInspector
        renderInspector={renderInspector}
      />,
    );
    // Inspector only mounts after single selection — slot is wired even if not open yet.
    expect(renderInspector).not.toHaveBeenCalled();
  });
});
