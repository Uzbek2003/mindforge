export type Screen = 'landing' | 'discover' | 'restaurant' | 'checkout' | 'tracking'

export type Cuisine =
  | 'Neighborhood'
  | 'Breakfast'
  | 'Noodles'
  | 'Grill'
  | 'Sweets'
  | 'Greens'

export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  prepMinutes: number
  tags?: string[]
  popular?: boolean
}

export interface Restaurant {
  id: string
  name: string
  cuisine: Cuisine
  neighborhood: string
  rating: number
  reviewCount: number
  exactEtaMinutes: number
  deliveryFee: number
  kitchenNote: string
  accent: string
  dishHint: string
  menu: MenuItem[]
}

export interface CartLine {
  key: string
  restaurantId: string
  item: MenuItem
  quantity: number
}

export type KitchenStage = 'queued' | 'prepping' | 'plated' | 'out' | 'nearby' | 'delivered'

export interface ActiveOrder {
  id: string
  restaurantId: string
  restaurantName: string
  lines: CartLine[]
  address: string
  tip: number
  courierPayShare: number
  placedAt: number
  promisedMinute: number
  total: number
}
