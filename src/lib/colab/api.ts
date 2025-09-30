export async function createInvite({
  apiUrl,
  jwt,
  diagramId,
  email,                 // puedes seguir llamándolo "email" aquí…
  role,
  expiresInDays = 7,
}: {
  apiUrl: string
  jwt: string
  diagramId: number
  email: string
  role: "EDITOR" | "VIEWER"
  expiresInDays?: number
}) {
  const res = await fetch(`${apiUrl}/diagrams/${diagramId}/invitations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    // …pero en el body lo mandamos como inviteeEmail (clave que usa el DTO)
    body: JSON.stringify({ inviteeEmail: email, role, expiresInDays }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.message || "Error creando invitación")
  // tipar el retorno correctamente
  return json.invite as {
    id: number
    token: string
    expiresAt: string
    role: "EDITOR" | "VIEWER"
    inviteeEmail: string
  }
}

export async function listInvites({
  apiUrl,
  jwt,
  diagramId,
}: {
  apiUrl: string
  jwt: string
  diagramId: number
}) {
  const res = await fetch(`${apiUrl}/diagrams/${diagramId}/invitations`, {
    headers: { Authorization: `Bearer ${jwt}` },
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.message || "Error listando invitaciones")
  return json.invitations as Array<{
    id: number
    inviteeEmail: string
    role: "EDITOR" | "VIEWER"
    status: "PENDING" | "ACCEPTED" | "REVOKED"
    createdAt: string
    expiresAt: string
    acceptedAt?: string
    token?: string // si el endpoint la devuelve; si no, quítalo
  }>
}

export async function revokeInvite({
  apiUrl,
  jwt,
  inviteId,
}: {
  apiUrl: string
  jwt: string
  inviteId: number
}) {
  const res = await fetch(`${apiUrl}/invitations/${inviteId}/revoke`, {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}` },
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.message || "Error revocando invitación")
  return json as { ok: true }
}

export async function acceptInvite({
  apiUrl,
  jwt,
  token,
}: {
  apiUrl: string
  jwt: string
  token: string
}) {
  const res = await fetch(`${apiUrl}/invitations/accept`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({ token }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.message || "No se pudo aceptar invitación")
  return json as { ok: true; diagramId: number; role: "EDITOR" | "VIEWER" | "OWNER" }
}
