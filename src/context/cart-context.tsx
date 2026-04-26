/* eslint-disable react-refresh/only-export-components */
import * as React from "react"
import type { CartItem, CartItemComposition, Product } from "@/types"
import { computeCartItemUnitPrice } from "@/types"

interface CartContextValue {
  items: CartItem[]
  addItem: (product: Product, quantity?: number, customCompositions?: CartItemComposition[]) => void
  removeItem: (productId: string, compositionKey?: string) => void
  updateQty: (productId: string, quantity: number, compositionKey?: string) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
}

const CartContext = React.createContext<CartContextValue | undefined>(undefined)

const STORAGE_KEY = "pempek_cart_v2"

/** Stable key for a cart item — product id for fixed, or product id + sorted composition for Mix Custom */
function cartItemKey(item: CartItem): string {
  if (item.custom_compositions && item.custom_compositions.length > 0) {
    const sig = item.custom_compositions
      .slice()
      .sort((a, b) => a.pempek_type_id.localeCompare(b.pempek_type_id))
      .map((c) => `${c.pempek_type_id}:${c.quantity}`)
      .join(",")
    return `${item.product.id}|${sig}`
  }
  return item.product.id
}

function loadCart(): CartItem[] {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    return stored ? (JSON.parse(stored) as CartItem[]) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<CartItem[]>(loadCart)

  React.useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const addItem = React.useCallback(
    (product: Product, quantity = 1, customCompositions?: CartItemComposition[]) => {
      const newItem: CartItem = { product, quantity, custom_compositions: customCompositions }
      const key = cartItemKey(newItem)

      setItems((prev) => {
        const existing = prev.find((i) => cartItemKey(i) === key)
        if (existing) {
          return prev.map((i) =>
            cartItemKey(i) === key ? { ...i, quantity: i.quantity + quantity } : i
          )
        }
        return [...prev, newItem]
      })
    },
    []
  )

  const removeItem = React.useCallback((productId: string, compositionKey?: string) => {
    setItems((prev) =>
      prev.filter((i) => {
        const key = cartItemKey(i)
        if (compositionKey) return key !== compositionKey
        return i.product.id !== productId
      })
    )
  }, [])

  const updateQty = React.useCallback(
    (productId: string, quantity: number, compositionKey?: string) => {
      setItems((prev) => {
        const key = compositionKey ?? productId
        if (quantity <= 0) {
          return prev.filter((i) => {
            const iKey = compositionKey ? cartItemKey(i) : i.product.id
            return iKey !== key
          })
        }
        return prev.map((i) => {
          const iKey = compositionKey ? cartItemKey(i) : i.product.id
          return iKey === key ? { ...i, quantity } : i
        })
      })
    },
    []
  )

  const clearCart = React.useCallback(() => {
    setItems([])
  }, [])

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = items.reduce(
    (sum, i) => sum + computeCartItemUnitPrice(i) * i.quantity,
    0
  )

  const value = React.useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      updateQty,
      clearCart,
      totalItems,
      totalPrice,
    }),
    [items, addItem, removeItem, updateQty, clearCart, totalItems, totalPrice]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const context = React.useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}

export { cartItemKey }
