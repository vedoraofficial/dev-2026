import { useQuery } from "@tanstack/react-query"

import { getProfileDetails, updateProfileDetails } from "@/features/account/api"
import { accountKeys } from "@/features/account/queries"
import { AppError } from "@/lib/errors"
import { makeAvatar } from "@/lib/image"
import { useApiMutation } from "@/lib/mutation"
import { useSession } from "@/lib/session"

/**
 * The backend has no photo upload; `profile_photo` is a text column of 1,000 characters. So the
 * photo is shrunk in the browser to a small thumbnail that fits that column and is saved with
 * PATCH /api/user/profile-details — it then shows on every device. A sharper 256 px copy is kept
 * in this browser and used while it still belongs to the saved thumbnail.
 */
const MAX_CHARS = 1000
const MAX_FILE_BYTES = 10 * 1024 * 1024
const storageKey = (vedId: string) => `vedora.photo.${vedId}`

type LocalPhoto = { thumb: string; full: string }

function readLocal(vedId: string): LocalPhoto | null {
  try {
    const raw = localStorage.getItem(storageKey(vedId))
    return raw ? (JSON.parse(raw) as LocalPhoto) : null
  } catch {
    return null
  }
}

function writeLocal(vedId: string, photo: LocalPhoto | null) {
  try {
    if (photo) localStorage.setItem(storageKey(vedId), JSON.stringify(photo))
    else localStorage.removeItem(storageKey(vedId))
  } catch {
    // Storage full or blocked — the saved thumbnail is still used.
  }
}

/** Only images we produced or plain web links are shown. */
const safeSrc = (src: string | null | undefined) =>
  src && /^(data:image\/(webp|jpeg|png);base64,|https?:\/\/)/.test(src) ? src : undefined

/** The signed-in user's photo, plus upload / remove. Shared by the profile card and the shell. */
export function useProfilePhoto(enabled = true) {
  const vedId = useSession((s) => s.user?.vedId)
  const details = useQuery({
    queryKey: accountKeys.profileDetails,
    queryFn: getProfileDetails,
    enabled: enabled && !!vedId,
  })

  const saved = details.data?.profilePhoto ?? null
  const local = vedId ? readLocal(vedId) : null
  const src = local && saved && local.thumb === saved ? local.full : safeSrc(saved)

  const upload = useApiMutation(
    async (file: File) => {
      if (!vedId) throw new AppError("Sign in again to change your photo")
      if (!file.type.startsWith("image/"))
        throw new AppError("Choose an image file (JPG, PNG or WebP)")
      if (file.size > MAX_FILE_BYTES) throw new AppError("Choose a photo smaller than 10 MB")
      const avatar = await makeAvatar(file, MAX_CHARS)
      await updateProfileDetails({ profilePhoto: avatar.thumb })
      writeLocal(vedId, avatar)
    },
    { success: "Profile photo updated", invalidate: [accountKeys.profileDetails] },
  )

  const remove = useApiMutation(
    async () => {
      await updateProfileDetails({ profilePhoto: "" })
      if (vedId) writeLocal(vedId, null)
    },
    { success: "Profile photo removed", invalidate: [accountKeys.profileDetails] },
  )

  return { src, hasPhoto: !!src, upload, remove, isLoading: details.isPending }
}
