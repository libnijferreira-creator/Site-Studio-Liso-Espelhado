"use client";

import { useActionState } from "react";
import { loginAction, type FormState } from "@/app/admin/actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    loginAction,
    null
  );

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label className="field-label" htmlFor="username">
          Usuário
        </label>
        <input
          id="username"
          name="username"
          className="field"
          autoComplete="username"
          placeholder="admin"
          required
        />
      </div>

      <div>
        <label className="field-label" htmlFor="password">
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="field"
          autoComplete="current-password"
          placeholder="••••••••"
          required
        />
      </div>

      {state?.error ? (
        <p className="border-l-2 border-red-400 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <button type="submit" className="btn btn-gold w-full" disabled={pending}>
        {pending ? "Entrando..." : "Entrar no painel"}
      </button>
    </form>
  );
}
