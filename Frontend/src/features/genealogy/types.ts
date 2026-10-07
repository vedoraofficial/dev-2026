import type { Gender, UserStatus } from "@/types/user"
import type { UserRole } from "@/types/session"

/** A partner placed directly under someone (GET /api/partner/me/genealogy, /:vedId/genealogy). */
export type DirectPartner = {
  id: number
  vedId: string
  name: string
  email: string
  mobile: string
  slotNumber: number
  depth: number
  status: string
}

type UserRef = { id: number; vedId: string; name: string }

/** GET /api/partner/me/genealogy */
export type MyGenealogy = {
  user: UserRef & { email: string; mobile: string; role: UserRole; status: UserStatus }
  node: {
    depth: number
    slotNumber: number | null
    placementStatus: string
    parent: UserRef | null
  } | null
  directPartnersCount: number
  maxSlots: number
  directPartners: DirectPartner[]
  commissionUplines: Record<
    "level1" | "level2" | "level3" | "level4" | "level5",
    UserRef | null
  > | null
}

/** GET /api/partner/my-slots */
export type MySlots = {
  sponsor: UserRef & { role: UserRole }
  totalFilled: number
  totalAvailable: number
  maxSlots: number
  filledSlots: {
    slotNumber: number
    partner: {
      id: number
      vedId: string
      name: string
      email: string
      mobile: string
      status: UserStatus
      joinedAt: string
    }
  }[]
  slots: { slotNumber: number; isOccupied: boolean }[]
}

/** Optional profile fields both join APIs accept. */
type ProfileFields = {
  dateOfBirth?: string
  gender?: Gender
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  pincode?: string
  profilePhoto?: string
}

/** POST /api/partner/register-downline — the signed-in user adds a partner under themselves. */
export type RegisterDownlineInput = ProfileFields & {
  name: string
  email: string
  mobile: string
  password: string
  /** 1–20; leave out for the lowest free slot */
  slotNumber?: number
  /** Place under this team member instead of yourself; you stay the sponsor (direct ₹200) */
  parentVedId?: string
}

/** POST /api/partner/join — public sign-up under a sponsor. */
export type JoinPartnerInput = ProfileFields & {
  referralId: string
  name: string
  email: string
  mobile: string
  password: string
}

/** Response of both join APIs. */
export type JoinedPartner = {
  message: string
  partner: {
    id: number
    vedId: string
    name: string
    email: string
    mobile: string
    role: UserRole
    status: UserStatus
    slotNumber: number
    depth: number
    sponsorVedId: string
    sponsorName: string
    /** Tree parent — differs from the sponsor when placed under a team member */
    placedUnderVedId?: string
    placedUnderName?: string
  }
}

/** One card in the genealogy tree, built from the API (see `use-genealogy-tree.ts`). */
export type TreeMember = {
  /** VEDORA ID */
  id: string
  /** Short label on the tree card */
  name: string
  fullName: string
  /** Depth from the tree's root (root itself is 0). */
  level: number
  /** Position under the sponsor. Above 20 = valid in the tree but earns the sponsor no BV. */
  slot: number
  sponsor: string
  joined: string
  /** Counts the backend doesn't send are `null` and show as "—". */
  direct: number | null
  downline: number | null
  bvContributed: number | null
  /** Next free BV-eligible slot, or null when 20 / 20 are taken */
  openSlot: number | null
  children: TreeMember[]
  /** The member's team hasn't been fetched yet — opening the card loads it. */
  pending?: boolean
  /** The server didn't allow opening this member's team (403) */
  teamHidden?: boolean
  /** Placement status from the backend (ACTIVE, …) */
  status?: string
}
