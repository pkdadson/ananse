import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { SearchBar } from "../src/controls/SearchBar.js";

function ControlledSearchBar({ onChange }: { onChange: (value: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <SearchBar
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

describe("SearchBar", () => {
  it("renders an input and delegates changes", async () => {
    const onChange = vi.fn();
    render(<ControlledSearchBar onChange={onChange} />);
    const input = screen.getByRole("searchbox", { name: /search org chart/i });
    await userEvent.type(input, "ada");
    expect(onChange).toHaveBeenLastCalledWith("ada");
  });

  it("shows a clear button when value is present", async () => {
    const onChange = vi.fn();
    render(<SearchBar value="ada" onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: /clear search/i }));
    expect(onChange).toHaveBeenLastCalledWith("");
  });
});
