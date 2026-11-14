import { useState } from 'react'
import {
  addCartItem,
  cartItemCount,
  cartSubtotal,
  setCartQuantity,
} from '../cartLogic'
import type { CartLine, MenuItem } from '../types'

export function useCart() {
  const [lines, setLines] = useState<CartLine[]>([])

  const restaurantId = lines[0]?.restaurantId ?? null

  function addItem(restaurantIdIn: string, item: MenuItem) {
    setLines((prev) => addCartItem(prev, restaurantIdIn, item))
  }

  function setQuantity(key: string, quantity: number) {
    setLines((prev) => setCartQuantity(prev, key, quantity))
  }

  function clear() {
    setLines([])
  }

  return {
    lines,
    restaurantId,
    itemCount: cartItemCount(lines),
    subtotal: cartSubtotal(lines),
    addItem,
    setQuantity,
    clear,
  }
}
