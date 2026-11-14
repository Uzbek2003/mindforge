import { describe, expect, it } from 'vitest'
import { getRestaurant, RESTAURANTS } from './restaurants'

describe('restaurants catalog', () => {
  it('ships a neighborhood kitchen lineup', () => {
    expect(RESTAURANTS.length).toBeGreaterThanOrEqual(6)
    for (const kitchen of RESTAURANTS) {
      expect(kitchen.exactEtaMinutes).toBeGreaterThan(0)
      expect(kitchen.menu.length).toBeGreaterThan(0)
      expect(getRestaurant(kitchen.id)?.name).toBe(kitchen.name)
    }
  })
})
