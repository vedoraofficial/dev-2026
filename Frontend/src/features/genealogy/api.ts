import type {
  DirectPartner,
  JoinedPartner,
  JoinPartnerInput,
  MyGenealogy,
  MySlots,
  RegisterDownlineInput,
} from "@/features/genealogy/types"
import { api } from "@/lib/api"
import { normalizeVedId } from "@/lib/ved-id"

/** GET /api/partner/me/genealogy — me, my placement, my direct partners and 5 uplines. */
export async function getMyGenealogy(): Promise<MyGenealogy> {
  const { data } = await api.get<MyGenealogy>("/partner/me/genealogy")
  return data
}

/** GET /api/partner/my-slots — my 20 slots and who sits in them. */
export async function getMySlots(): Promise<MySlots> {
  const { data } = await api.get<MySlots>("/partner/my-slots")
  return data
}

/** GET /api/partner/:vedId/genealogy — [Admin] direct partners under any ID. */
export async function getGenealogyOf(vedId: string): Promise<DirectPartner[]> {
  const { data } = await api.get<DirectPartner[]>(
    `/partner/${encodeURIComponent(normalizeVedId(vedId))}/genealogy`,
  )
  return data
}

/** POST /api/partner/register-downline — add a partner under the signed-in user. */
export async function registerDownline(input: RegisterDownlineInput): Promise<JoinedPartner> {
  const { data } = await api.post<JoinedPartner>("/partner/register-downline", input)
  return data
}

/** POST /api/partner/join — public: join under a sponsor's VEDORA ID. */
export async function joinPartner(input: JoinPartnerInput): Promise<JoinedPartner> {
  const { data } = await api.post<JoinedPartner>("/partner/join", {
    ...input,
    referralId: normalizeVedId(input.referralId),
  })
  return data
}
