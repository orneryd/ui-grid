import { GridRecord } from '@ornery/ui-grid';

export function createDemoData(): GridRecord[] {
  const statuses = ['Active', 'Expansion', 'Enterprise', 'Pilot'];
  const companies = ['Northwind', 'Blue Harbor', 'Forge Group', 'Larkspur', 'Atlas'];
  const owners = ['Casey Tran', 'Jordan Silva', 'Priya Rao', 'Evan Brooks', 'Mina Patel'];

  return Array.from({ length: 100_000 }, (_value, index) => ({
    id: `row-${index + 1}`,
    name: `Customer ${index + 1}`,
    company: companies[index % companies.length],
    revenue: 40000 + index * 1350,
    status: statuses[index % statuses.length],
    renewalDate: `2026-${String((index % 12) + 1).padStart(2, '0')}-${String((index % 27) + 1).padStart(2, '0')}`,
    account: { owner: owners[index % owners.length] },
  }));
}

export function createSmallDemoData(count = 8): GridRecord[] {
  const statuses = ['Active', 'Expansion', 'Enterprise', 'Pilot'];
  const companies = ['Northwind', 'Blue Harbor', 'Forge Group', 'Larkspur'];

  return Array.from({ length: count }, (_value, index) => ({
    id: `demo-${index + 1}`,
    name: `Customer ${index + 1}`,
    company: companies[index % companies.length],
    revenue: 25000 + index * 5000,
    status: statuses[index % statuses.length],
    account: { owner: `Owner ${index + 1}` },
  }));
}

export function createTreeDemoData(): GridRecord[] {
  return Array.from({ length: 6 }, (_value, index) => ({
    id: `parent-${index + 1}`,
    name: `Parent ${index + 1}`,
    status: index % 2 === 0 ? 'Active' : 'Pilot',
    revenue: 3000 + index * 225,
    account: { owner: `Tree Owner ${index + 1}` },
    children: [
      {
        id: `parent-${index + 1}-child-1`,
        name: `Child ${index + 1}.1`,
        status: 'Expansion',
        revenue: 700 + index * 50,
        account: { owner: `Tree Owner ${index + 1}A` },
      },
      {
        id: `parent-${index + 1}-child-2`,
        name: `Child ${index + 1}.2`,
        status: 'Pilot',
        revenue: 900 + index * 60,
        account: { owner: `Tree Owner ${index + 1}B` },
      },
    ],
  }));
}
