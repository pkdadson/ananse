import type { Employee } from "@ananse/core";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { OrgChart } from "../src/OrgChart.js";

const data: Employee[] = [
  { id: "ceo", name: "Ada Lovelace", title: "CEO", managerId: null },
  { id: "vp", name: "Grace Hopper", title: "VP Eng", managerId: "ceo" },
];

describe("<OrgChart> features", () => {
  it("shows the search bar when showSearch is true", () => {
    render(<OrgChart data={data} mode="view" showSearch />);
    expect(screen.getByRole("searchbox", { name: /search org chart/i })).toBeInTheDocument();
  });

  it("hides the search bar by default", () => {
    render(<OrgChart data={data} mode="view" />);
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  });

  it("dims unmatched nodes when a search query has matches", async () => {
    render(<OrgChart data={data} mode="view" showSearch />);
    await userEvent.type(screen.getByRole("searchbox"), "grace");
    const ada = screen.getByText("Ada Lovelace").closest("[data-ananse-search-dim]");
    expect(ada?.getAttribute("data-ananse-search-dim")).toBe("true");
  });
});
