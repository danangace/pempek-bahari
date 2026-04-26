import * as React from "react"
import { supabase } from "@/lib/supabase"
import type { BankAccount } from "@/types"

interface UseBankAccountsResult {
  bankAccounts: BankAccount[]
  loading: boolean
}

export function useBankAccounts(): UseBankAccountsResult {
  const [bankAccounts, setBankAccounts] = React.useState<BankAccount[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false

    async function fetchBankAccounts() {
      const { data } = await supabase
        .from("bank_accounts")
        .select("id, name, bank_name, account_number")
        .order("bank_name")

      if (!cancelled) {
        setBankAccounts((data as BankAccount[]) ?? [])
        setLoading(false)
      }
    }

    void fetchBankAccounts()
    return () => {
      cancelled = true
    }
  }, [])

  return { bankAccounts, loading }
}
