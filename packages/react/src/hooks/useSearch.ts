import type { Employee } from "@ananse/core";
import { searchEmployees } from "@ananse/core";
import { useMemo, useState } from "react";

export type UseSearch = {
  query: string;
  setQuery: (query: string) => void;
  matchIds: Set<string>;
};

export function useSearch(employees: Employee[]): UseSearch {
  const [query, setQuery] = useState("");

  const matchIds = useMemo(() => {
    if (query.trim() === "") return new Set<string>();
    return new Set(searchEmployees(employees, query).map((e) => e.id));
  }, [employees, query]);

  return { query, setQuery, matchIds };
}
