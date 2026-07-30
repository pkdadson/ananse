/**
 * CSF story stubs — drop into Storybook/Ladle when you add a visual workshop.
 *
 *   pnpm add -D storybook @storybook/react-vite
 *   // point stories glob at packages/react/stories
 */
import type { Employee } from "@ananse/core";
import { OrgChart } from "../src/OrgChart.js";

const sample: Employee[] = [
  { id: "ceo", name: "Ada Lovelace", title: "CEO", managerId: null, department: "operations" },
  {
    id: "cto",
    name: "Grace Hopper",
    title: "CTO",
    managerId: "ceo",
    department: "engineering",
    email: "grace@example.com",
    workMode: "remote",
  },
  {
    id: "eng",
    name: "Alan Turing",
    title: "Engineer",
    managerId: "cto",
    department: "engineering",
  },
];

export default {
  title: "Ananse/OrgChart",
  component: OrgChart,
};

export const ViewDetailed = {
  args: {
    defaultData: sample,
    mode: "view",
    showSearch: true,
    nodeVariant: "detailed",
    height: 560,
  },
};

export const EditSimple = {
  args: {
    defaultData: sample,
    mode: "edit",
    showSearch: true,
    height: 560,
  },
};

export const CompactNoEmail = {
  args: {
    defaultData: sample,
    nodeVariant: "compact",
    fields: { email: false, badges: false },
    height: 480,
  },
};

export const Minimal = {
  args: {
    defaultData: sample,
    nodeVariant: "minimal",
    height: 400,
  },
};
