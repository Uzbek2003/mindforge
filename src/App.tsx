import { useMemo, useState } from 'react'
import { CartBar } from './components/CartBar'
import { Checkout } from './components/Checkout'
import { Discover } from './components/Discover'
import { Landing } from './components/Landing'
import { RestaurantView } from './components/RestaurantView'
import { Shell } from './components/Shell'
import { Tracking } from './components/Tracking'
import { getRestaurant, RESTAURANTS } from './data/restaurants'
import { useCart } from './hooks/useCart'
import type { ActiveOrder, Restaurant, Screen } from './types'
import './App.css'

function makeDemoOrder(): ActiveOrder {
  const restaurant = RESTAURANTS[1]
  const item = restaurant.menu[0]
  return {
    id: `KITH-${Date.now().toString().slice(-6)}`,
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
    lines: [
      {
        key: `${restaurant.id}:${item.id}`,
        restaurantId: restaurant.id,
        item,
        quantity: 1,
      },
    ],
    address: '184 Harbor Lane',
    tip: 3,
    courierPayShare: 5.24,
    placedAt: Date.now(),
    promisedMinute: restaurant.exactEtaMinutes,
    total: item.price + restaurant.deliveryFee + 3 + 0.84,
  }
}

export default function App() {
  const cart = useCart()
  const [screen, setScreen] = useState<Screen>('landing')
  const [activeRestaurantId, setActiveRestaurantId] = useState<string | null>(null)
  const [order, setOrder] = useState<ActiveOrder | null>(null)

  const activeRestaurant: Restaurant | null = useMemo(() => {
    if (!activeRestaurantId) return null
    return getRestaurant(activeRestaurantId) ?? null
  }, [activeRestaurantId])

  function goHome() {
    setScreen('landing')
  }

  function openDiscover() {
    setScreen('discover')
  }

  function openRestaurant(restaurant: Restaurant) {
    setActiveRestaurantId(restaurant.id)
    setScreen('restaurant')
  }

  function placeOrder(payload: {
    address: string
    tip: number
    total: number
    courierPayShare: number
  }) {
    const restaurant = getRestaurant(cart.restaurantId ?? '')
    if (!restaurant) return
    const next: ActiveOrder = {
      id: `KITH-${Date.now().toString().slice(-6)}`,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      lines: cart.lines,
      address: payload.address,
      tip: payload.tip,
      courierPayShare: payload.courierPayShare,
      placedAt: Date.now(),
      promisedMinute: restaurant.exactEtaMinutes,
      total: payload.total,
    }
    setOrder(next)
    cart.clear()
    setScreen('tracking')
  }

  const showCart =
    (screen === 'discover' || screen === 'restaurant') && cart.itemCount > 0

  return (
    <Shell
      brandAction={goHome}
      solid={screen !== 'landing'}
      trailing={
        screen !== 'landing' ? (
          <button type="button" className="text-link text-link--quiet" onClick={openDiscover}>
            Nearby
          </button>
        ) : null
      }
    >
      {screen === 'landing' && (
        <Landing
          onStart={openDiscover}
          onTrackDemo={() => {
            setOrder(makeDemoOrder())
            setScreen('tracking')
          }}
        />
      )}

      {screen === 'discover' && <Discover onOpen={openRestaurant} />}

      {screen === 'restaurant' && activeRestaurant && (
        <RestaurantView
          restaurant={activeRestaurant}
          onBack={openDiscover}
          onAdd={(item) => cart.addItem(activeRestaurant.id, item)}
        />
      )}

      {screen === 'checkout' && (
        <Checkout
          lines={cart.lines}
          onBack={() => setScreen(activeRestaurantId ? 'restaurant' : 'discover')}
          onChangeQty={cart.setQuantity}
          onPlace={placeOrder}
        />
      )}

      {screen === 'tracking' && order && (
        <Tracking order={order} onHome={goHome} onOrderAgain={openDiscover} />
      )}

      {showCart && (
        <CartBar
          itemCount={cart.itemCount}
          subtotal={cart.subtotal}
          onCheckout={() => setScreen('checkout')}
        />
      )}
    </Shell>
  )
}
