interface CartBarProps {
  itemCount: number
  subtotal: number
  onCheckout: () => void
}

export function CartBar({ itemCount, subtotal, onCheckout }: CartBarProps) {
  if (itemCount === 0) return null

  return (
    <div className="cart-bar">
      <button type="button" className="cart-bar__btn" onClick={onCheckout}>
        <span className="cart-bar__count">{itemCount}</span>
        <span>Review bag</span>
        <span className="cart-bar__total">${subtotal.toFixed(2)}</span>
      </button>
    </div>
  )
}
