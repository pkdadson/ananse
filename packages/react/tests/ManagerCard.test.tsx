import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ManagerCard } from "../src/nodes/ManagerCard.js";

describe("ManagerCard", () => {
  it("shows direct report count", () => {
    render(
      <ManagerCard
        data={{ id: "1", name: "Grace Hopper", title: "VP" }}
        directReportCount={5}
        collapsed={false}
        onToggleCollapse={() => {}}
      />,
    );
    expect(screen.getByText(/5 reports/i)).toBeInTheDocument();
  });

  it('uses singular "report" when count is 1', () => {
    render(
      <ManagerCard
        data={{ id: "1", name: "Grace" }}
        directReportCount={1}
        collapsed={false}
        onToggleCollapse={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: /hide 1 report/i })).toBeInTheDocument();
  });

  it("invokes onToggleCollapse when the toggle is clicked", async () => {
    const onToggle = vi.fn();
    render(
      <ManagerCard
        data={{ id: "1", name: "Grace" }}
        directReportCount={3}
        collapsed={false}
        onToggleCollapse={onToggle}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /hide 3 reports/i }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("shows expand label when collapsed", () => {
    render(
      <ManagerCard
        data={{ id: "1", name: "Grace" }}
        directReportCount={3}
        collapsed={true}
        onToggleCollapse={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: /show 3 reports/i })).toBeInTheDocument();
  });
});
