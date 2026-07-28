import type { Config } from 'tailwindcss';

const preset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        'canvas-bg': 'var(--canvas-bg)',
        'canvas-node': 'var(--canvas-node-bg)',
        'canvas-node-border': 'var(--canvas-node-border)',
        'canvas-node-text': 'var(--canvas-node-text)',
        'canvas-node-text-muted': 'var(--canvas-node-text-muted)',
        'canvas-edge': 'var(--canvas-edge-color)',
        'canvas-edge-highlight': 'var(--canvas-edge-highlight)',
        'canvas-focus': 'var(--canvas-focus-ring)',
        'canvas-selection': 'var(--canvas-selection-bg)',
        'canvas-dept-engineering': 'var(--canvas-dept-engineering)',
        'canvas-dept-design': 'var(--canvas-dept-design)',
        'canvas-dept-product': 'var(--canvas-dept-product)',
        'canvas-dept-sales': 'var(--canvas-dept-sales)',
        'canvas-dept-marketing': 'var(--canvas-dept-marketing)',
        'canvas-dept-hr': 'var(--canvas-dept-hr)',
        'canvas-dept-finance': 'var(--canvas-dept-finance)',
        'canvas-dept-operations': 'var(--canvas-dept-operations)',
        'canvas-tenure-new': 'var(--canvas-tenure-new)',
        'canvas-tenure-tenured': 'var(--canvas-tenure-tenured)',
        'canvas-tenure-veteran': 'var(--canvas-tenure-veteran)',
      },
      borderRadius: {
        'canvas-node': 'var(--canvas-node-radius)',
      },
      boxShadow: {
        'canvas-node': 'var(--canvas-node-shadow)',
        'canvas-node-hover': 'var(--canvas-node-shadow-hover)',
        'canvas-executive': 'var(--canvas-role-executive-shadow)',
      },
    },
  },
};

export default preset;
