import type { Config } from "tailwindcss";

const preset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        "ananse-bg": "var(--ananse-bg)",
        "ananse-node": "var(--ananse-node-bg)",
        "ananse-node-border": "var(--ananse-node-border)",
        "ananse-node-text": "var(--ananse-node-text)",
        "ananse-node-text-muted": "var(--ananse-node-text-muted)",
        "ananse-edge": "var(--ananse-edge-color)",
        "ananse-edge-highlight": "var(--ananse-edge-highlight)",
        "ananse-focus": "var(--ananse-focus-ring)",
        "ananse-selection": "var(--ananse-selection-bg)",
        "ananse-dept-engineering": "var(--ananse-dept-engineering)",
        "ananse-dept-design": "var(--ananse-dept-design)",
        "ananse-dept-product": "var(--ananse-dept-product)",
        "ananse-dept-sales": "var(--ananse-dept-sales)",
        "ananse-dept-marketing": "var(--ananse-dept-marketing)",
        "ananse-dept-hr": "var(--ananse-dept-hr)",
        "ananse-dept-finance": "var(--ananse-dept-finance)",
        "ananse-dept-operations": "var(--ananse-dept-operations)",
        "ananse-tenure-new": "var(--ananse-tenure-new)",
        "ananse-tenure-tenured": "var(--ananse-tenure-tenured)",
        "ananse-tenure-veteran": "var(--ananse-tenure-veteran)",
        "ananse-badge-bg": "var(--ananse-badge-bg)",
        "ananse-badge-text": "var(--ananse-badge-text)",
        "ananse-badge-remote": "var(--ananse-badge-remote)",
        "ananse-badge-hybrid": "var(--ananse-badge-hybrid)",
        "ananse-badge-onsite": "var(--ananse-badge-onsite)",
        "ananse-badge-contractor": "var(--ananse-badge-contractor)",
        "ananse-badge-intern": "var(--ananse-badge-intern)",
        "ananse-badge-tenure": "var(--ananse-badge-tenure)",
      },
      borderRadius: {
        "ananse-node": "var(--ananse-node-radius)",
      },
      boxShadow: {
        "ananse-node": "var(--ananse-node-shadow)",
        "ananse-node-hover": "var(--ananse-node-shadow-hover)",
        "ananse-executive": "var(--ananse-role-executive-shadow)",
      },
    },
  },
};

export default preset;
