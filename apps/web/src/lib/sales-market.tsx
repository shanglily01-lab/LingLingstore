'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type SalesMarket = 'CN' | 'OVERSEAS'

const KEY = 'sales-market'

const SalesMarketContext = createContext<{
  market: SalesMarket
  setMarket: (market: SalesMarket) => void
}>({
  market: 'CN',
  setMarket: () => {},
})

export function SalesMarketProvider({ children }: { children: ReactNode }) {
  const [market, setMarketState] = useState<SalesMarket>('CN')

  useEffect(() => {
    const saved = localStorage.getItem(KEY)
    if (saved === 'CN' || saved === 'OVERSEAS') setMarketState(saved)
  }, [])

  const setMarket = (next: SalesMarket) => {
    setMarketState(next)
    localStorage.setItem(KEY, next)
  }

  return <SalesMarketContext.Provider value={{ market, setMarket }}>{children}</SalesMarketContext.Provider>
}

export function useSalesMarket() {
  return useContext(SalesMarketContext)
}
