import { describe, expect, it } from 'vitest';
import { employeeSchema, orgChartSchema } from '../src/schemas.js';

describe('employeeSchema', () => {
  it('accepts a minimal valid employee', () => {
    const parsed = employeeSchema.safeParse({ id: '1', name: 'Ada' });
    expect(parsed.success).toBe(true);
  });

  it('rejects missing id', () => {
    const parsed = employeeSchema.safeParse({ name: 'Ada' });
    expect(parsed.success).toBe(false);
  });

  it('accepts photoUrl and department', () => {
    const parsed = employeeSchema.safeParse({
      id: '1',
      name: 'Ada',
      photoUrl: 'https://example.com/ada.png',
      department: 'engineering',
    });
    expect(parsed.success).toBe(true);
  });
});

describe('orgChartSchema', () => {
  it('accepts an empty array', () => {
    expect(orgChartSchema.safeParse([]).success).toBe(true);
  });

  it('rejects duplicate ids', () => {
    const parsed = orgChartSchema.safeParse([
      { id: '1', name: 'A' },
      { id: '1', name: 'B' },
    ]);
    expect(parsed.success).toBe(false);
  });

  it('rejects a managerId pointing to a non-existent employee', () => {
    const parsed = orgChartSchema.safeParse([{ id: '1', name: 'A', managerId: 'ghost' }]);
    expect(parsed.success).toBe(false);
  });

  it('accepts a valid two-level hierarchy', () => {
    const parsed = orgChartSchema.safeParse([
      { id: '1', name: 'CEO', managerId: null },
      { id: '2', name: 'VP', managerId: '1' },
    ]);
    expect(parsed.success).toBe(true);
  });
});
