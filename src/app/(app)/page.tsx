"use client";

import { useState, type FormEvent } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeader,
  ErrorState,
  Field,
  Input,
  KeyValueList,
  SkeletonText,
  toast,
} from "@drinks-on-chain/ui";
import { errorMessage } from "@/lib/api/errors";
import { fieldErrorsFrom } from "@/lib/api/field-errors";
import { useMe, useUpdateMe } from "@/lib/auth/hooks";
import { activeMembership } from "@/lib/auth/organization";
import { es } from "@/lib/i18n/es";

// Pantalla de ejemplo: lee GET /v1/users/me con los tres estados obligatorios y edita el
// nombre con PATCH /v1/users/me para mostrar cómo se marca el campo exacto de un 422.
export default function HomePage() {
  const me = useMe();
  const active = activeMembership(me.data);
  return (
    <div className="grid gap-6">
      <h1 className="font-display text-3xl">Inicio</h1>
      <Card className="max-w-xl p-6">
        {me.isPending ? (
          <SkeletonText lines={4} />
        ) : me.isError ? (
          <ErrorState bare description={errorMessage(me.error)} onRetry={() => me.refetch()} retrying={me.isFetching} />
        ) : (
          <KeyValueList
            items={[
              { term: "Nombre", value: me.data.user.fullName },
              { term: "Correo", value: me.data.user.email },
              { term: "Organización activa", value: active?.organizationName ?? es.organization.none },
              { term: "Rol", value: active ? (es.roles[active.role] ?? active.role) : "—" },
              {
                term: "Membresías",
                value: (
                  <span className="flex flex-wrap gap-1.5">
                    {me.data.memberships.map((m) => (
                      <Badge key={m.id} tone={m.status === "ACTIVE" ? "neutral" : "warning"}>
                        {m.organizationName}
                        {m.status === "BLOCKED" ? " · bloqueada" : ""}
                      </Badge>
                    ))}
                  </span>
                ),
              },
            ]}
          />
        )}
      </Card>
      {me.data && <ProfileNameForm key={me.data.user.fullName} initial={me.data.user.fullName} />}
    </div>
  );
}

function ProfileNameForm({ initial }: { initial: string }) {
  const update = useUpdateMe();
  const [fullName, setFullName] = useState(initial);
  const { fieldErrors, formErrors } = fieldErrorsFrom(update.error, ["fullName"]);
  const otherError =
    update.error && !fieldErrors.fullName && formErrors.length === 0 ? errorMessage(update.error) : null;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    update.mutate({ fullName }, { onSuccess: () => toast({ title: "Nombre guardado.", tone: "success" }) });
  }

  return (
    <Card className="max-w-xl p-6">
      <CardHeader title="Editar el nombre" description="Ejemplo de errores por campo: guarda el nombre vacío." />
      <form onSubmit={onSubmit} className="mt-4 grid gap-4" noValidate>
        {(formErrors.length > 0 || otherError) && <Alert tone="danger">{otherError ?? formErrors.join(" ")}</Alert>}
        <Field label="Nombre completo" error={fieldErrors.fullName}>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
        </Field>
        <div>
          <Button type="submit" loading={update.isPending}>
            {es.common.save}
          </Button>
        </div>
      </form>
    </Card>
  );
}
