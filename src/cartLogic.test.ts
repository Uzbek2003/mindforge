import { describe, expect, it } from 'vitest'
import { addCartItem, cartItemCount, cartSubtotal, setCartQuantity } from './cartLogic'
import { RESTAURANTS } from './data/restaurants'

describe('cartLogic', () => {
  const restaurant = RESTAURANTS[0]
  const item = restaurant.menu[0]
  const otherKitchen = RESTAURANTS[1]
  const otherItem = otherKitchen.menu[0]

  it('adds and increments items', () => {
    const once = addCartItem([], restaurant.id, item)
    const twice = addCartItem(once, restaurant.id, item)
    expect(cartItemCount(twice)).toBe(2)
    expect(cartSubtotal(twice)).toBeCloseTo(item.price * 2)
  })

  it('replaces bag when kitchen changes', () => {
    const first = addCartItem([], restaurant.id, item)
    const swapped = addCartItem(first, otherKitchen.id, otherItem)
    expect(swapped).toHaveLength(1)
    expect(swapped[0].restaurantId).toBe(otherKitchen.id)
  })

  it('removes a line when quantity hits zero', () => {
    const lines = addCartItem([], restaurant.id, item)
    const cleared = setCartQuantity(lines, lines[0].key, 0)
    expect(cleared).toHaveLength(0)
  })
})
