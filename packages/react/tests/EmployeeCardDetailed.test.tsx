import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmployeeCardDetailed } from "../src/nodes/EmployeeCardDetailed.js";

describe("EmployeeCardDetailed", () => {
  it("renders name, title, email, location", () => {
    render(
      <EmployeeCardDetailed
        data={{
          id: "1",
          name: "Ada Lovelace",
          title: "CEO",
          email: "ada@example.com",
          location: "London",
        }}
      />,
    );
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("CEO")).toBeInTheDocument();
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
    expect(screen.getByText("London")).toBeInTheDocument();
  });

  it("shows badges when workMode set", () => {
    render(
      <EmployeeCardDetailed data={{ id: "1", name: "Ada", workMode: "remote" }} />,
    );
    expect(screen.getByText(/remote/i)).toBeInTheDocument();
  });
});
