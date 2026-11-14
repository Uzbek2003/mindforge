import type { CartLine, MenuItem } from './types'

export function lineKey(restaurantId: string, itemId: string) {
  return `${restaurantId}:${itemId}`
}

export function addCartItem(
  prev: CartLine[],
  restaurantId: string,
  item: MenuItem,
): CartLine[] {
  if (prev.length && prev[0].restaurantId !== restaurantId) {
    return [
      {
        key: lineKey(restaurantId, item.id),
        restaurantId,
        item,
        quantity: 1,
      },
    ]
  }
  const existing = prev.find((l) => l.item.id === item.id)
  if (existing) {
    return prev.map((l) =>
      l.item.id === item.id ? { ...l, quantity: l.quantity + 1 } : l,
    )
  }
  return [
    ...prev,
    {
      key: lineKey(restaurantId, item.id),
      restaurantId,
      item,
      quantity: 1,
    },
  ]
}

export function setCartQuantity(prev: CartLine[], key: string, quantity: number): CartLine[] {
  if (quantity <= 0) return prev.filter((l) => l.key !== key)
  return prev.map((l) => (l.key === key ? { ...l, quantity } : l))
}

export function cartSubtotal(lines: CartLine[]) {
  return lines.reduce((sum, l) => sum + l.item.price * l.quantity, 0)
}

export function cartItemCount(lines: CartLine[]) {
  return lines.reduce((sum, l) => sum + l.quantity, 0)
}
