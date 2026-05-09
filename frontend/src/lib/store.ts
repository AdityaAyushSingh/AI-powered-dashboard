import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Conversation, Filters, QueryHistoryEntry, RightPanelView, ThemeMode } from './types'

const DEFAULT_FILTERS: Filters = { year: 2025 }

interface AppState {
  // Conversation (session-only)
  conversation: Conversation[]
  isLoading: boolean
  pendingQuestion: string | null

  // Persisted
  queryHistory: QueryHistoryEntry[]
  filters: Filters

  // UI
  sidebarOpen: boolean
  rightPanelOpen: boolean
  rightPanel: RightPanelView
  theme: ThemeMode
  useMockData: boolean
  commandPaletteOpen: boolean

  // Conversation actions
  addMessage: (msg: Conversation) => void
  clearConversation: () => void
  setLoading: (v: boolean) => void
  setPendingQuestion: (q: string | null) => void

  // History actions
  addToHistory: (entry: QueryHistoryEntry) => void
  removeFromHistory: (id: string) => void
  clearHistory: () => void

  // Filter actions
  setFilters: (f: Partial<Filters>) => void
  resetFilters: () => void

  // UI actions
  setSidebarOpen: (v: boolean) => void
  toggleSidebar: () => void
  setRightPanelOpen: (v: boolean) => void
  toggleRightPanel: () => void
  setRightPanel: (panel: RightPanelView) => void
  setTheme: (theme: ThemeMode) => void
  setUseMockData: (v: boolean) => void
  setCommandPaletteOpen: (v: boolean) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      conversation:       [],
      isLoading:          false,
      pendingQuestion:    null,
      queryHistory:       [],
      filters:            DEFAULT_FILTERS,
      sidebarOpen:        true,
      rightPanelOpen:     true,
      rightPanel:         'insights',
      theme:              'light',
      useMockData:        false,
      commandPaletteOpen: false,

      addMessage: (msg) =>
        set((s) => ({ conversation: [...s.conversation, msg] })),

      clearConversation: () => set({ conversation: [] }),

      setLoading: (v) => set({ isLoading: v }),

      setPendingQuestion: (q) => set({ pendingQuestion: q }),

      addToHistory: (entry) =>
        set((s) => ({ queryHistory: [entry, ...s.queryHistory].slice(0, 60) })),

      removeFromHistory: (id) =>
        set((s) => ({ queryHistory: s.queryHistory.filter((e) => e.id !== id) })),

      clearHistory: () => set({ queryHistory: [] }),

      setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),

      resetFilters: () => set({ filters: DEFAULT_FILTERS }),

      setSidebarOpen: (v) => set({ sidebarOpen: v }),

      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

      setRightPanelOpen: (v) => set({ rightPanelOpen: v }),

      toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),

      setRightPanel: (panel) => set({ rightPanel: panel, rightPanelOpen: true }),

      setTheme: (theme) => set({ theme }),

      setUseMockData: (v) => set({ useMockData: v }),

      setCommandPaletteOpen: (v) => set({ commandPaletteOpen: v }),
    }),
    {
      name: 'sv-store',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState) => ({
        ...(persistedState as AppState),
        useMockData: false,
      }),
      partialize: (s) => ({
        queryHistory:   s.queryHistory,
        filters:        s.filters,
        rightPanel:     s.rightPanel,
        rightPanelOpen: s.rightPanelOpen,
        sidebarOpen:    s.sidebarOpen,
        theme:          s.theme,
      }),
    },
  ),
)
