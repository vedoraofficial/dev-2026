import { useQuery } from "@tanstack/react-query"

import {
  getGenealogyOf,
  getMyGenealogy,
  getMySlots,
  joinPartner,
  registerDownline,
} from "@/features/genealogy/api"
import { useApiMutation } from "@/lib/mutation"

export const genealogyKeys = {
  all: ["genealogy"] as const,
  mine: ["genealogy", "me"] as const,
  slots: ["genealogy", "slots"] as const,
  of: (vedId: string) => ["genealogy", "of", vedId] as const,
}

export const useMyGenealogy = () =>
  useQuery({ queryKey: genealogyKeys.mine, queryFn: getMyGenealogy })

export const useMySlots = () => useQuery({ queryKey: genealogyKeys.slots, queryFn: getMySlots })

/** [Admin] direct partners under any VEDORA ID. */
/** Not worth retrying: 403 (not in your team) and 404 (no such ID) won't change. */
const retryServerErrorsOnce = (failures: number, error: unknown) =>
  failures < 1 && ((error as { response?: { status?: number } })?.response?.status ?? 500) >= 500

export const useGenealogyOf = (vedId: string) =>
  useQuery({
    queryKey: genealogyKeys.of(vedId),
    queryFn: () => getGenealogyOf(vedId),
    enabled: vedId.length > 0,
    retry: retryServerErrorsOnce,
  })

export const useRegisterDownline = () =>
  useApiMutation(registerDownline, {
    success: (r) =>
      `${r.partner.name} placed as ${r.partner.vedId} in slot ${r.partner.slotNumber}`,
    invalidate: [genealogyKeys.all],
  })

export const useJoinPartner = () =>
  useApiMutation(joinPartner, {
    success: (r) => `Welcome ${r.partner.name}! Your VEDORA ID is ${r.partner.vedId}`,
  })
