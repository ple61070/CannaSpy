import { create } from 'zustand'

interface Location {
  id: string
  name: string
  address: string
  dcc_license?: string
  active: boolean
}

interface Alert {
  id: string
  alert_type: string
  competitor_name: string
  location_name: string
  old_value: string | null
  new_value: string | null
  confidence: string
  reviewed: boolean
  created_at: string
}

interface AppState {
  currentLocationId: string | null
  locations: Location[]
  unreviewedAlertCount: number
  setCurrentLocation: (id: string) => void
  setLocations: (locations: Location[]) => void
  setUnreviewedAlertCount: (count: number) => void
}

export const useStore = create<AppState>((set) => ({
  currentLocationId: null,
  locations: [],
  unreviewedAlertCount: 0,
  setCurrentLocation: (id) => set({ currentLocationId: id }),
  setLocations: (locations) => set({ locations }),
  setUnreviewedAlertCount: (count) => set({ unreviewedAlertCount: count }),
}))
