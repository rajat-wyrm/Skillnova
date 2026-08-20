// ════════════════════════════════════════════════════════════
//  Search Store — Zustand
//  Shares loaded intern/report data for fast client-side search
// ════════════════════════════════════════════════════════════
import { create } from 'zustand';

export const useSearchStore = create((set, get) => ({
  query: '',
  results: [],
  interns: [],
  reports: [],

  setQuery: (query) => {
    const term = (query || '').toLowerCase().trim();
    const { interns, reports } = get();
    let results = [];
    if (term) {
      interns.forEach((i) => {
        if (
          (i.name || '').toLowerCase().includes(term) ||
          (i.email || '').toLowerCase().includes(term) ||
          (i.department || '').toLowerCase().includes(term)
        ) {
          results.push({ type: 'intern', id: i.id, name: i.name, department: i.department, avatarUrl: i.avatarUrl });
        }
      });
      reports.forEach((r) => {
        if (
          (r.title || '').toLowerCase().includes(term) ||
          (r.content || '').toLowerCase().includes(term) ||
          (r.user?.name || '').toLowerCase().includes(term)
        ) {
          results.push({ type: 'report', id: r.id, title: r.title, user: r.user });
        }
      });
    }
    set({ query, results: results.slice(0, 12) });
  },

  setInterns: (interns) => {
    set({ interns });
    get().setQuery(get().query);
  },

  setReports: (reports) => {
    set({ reports });
    get().setQuery(get().query);
  },

  clear: () => set({ query: '', results: [], interns: [], reports: [] }),
}));

export default useSearchStore;