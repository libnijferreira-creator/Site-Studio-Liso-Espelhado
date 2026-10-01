"use client";

import { useActionState, useState } from "react";
import {
  changePasswordAction,
  createAdminAction,
  deleteAdminAction,
  type FormState,
} from "@/app/admin/actions";
import type { AdminRow } from "@/lib/db";

/** `created_at` vem em UTC do SQLite — mostra a data no formato brasileiro. */
function formatDay(iso: string): string {
  const d = new Date(`${iso.replace(" ", "T")}Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR");
}

/** Formulário de troca de senha (um por usuário, com retorno do servidor). */
function PasswordForm({
  user,
  onCancel,
}: {
  user: AdminRow;
  onCancel: () => void;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    changePasswordAction,
    null
  );

  return (
    <form action={formAction} className="mt-5 border-t border-champagne pt-5">
      <input type="hidden" name="id" value={user.id} />

      <div className="grid gap-4 sm:grid-cols-[minmax(0,320px)_auto] sm:items-end">
        <div>
          <label className="field-label" htmlFor={`pw-${user.id}`}>
            Nova senha para {user.username}
          </label>
          <input
            id={`pw-${user.id}`}
            name="password"
            type="password"
            className="field"
            autoComplete="new-password"
            placeholder="mínimo 8 caracteres"
            minLength={8}
            required
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="submit" className="btn btn-gold" disabled={pending}>
            {pending ? "Salvando..." : "Salvar senha"}
          </button>
          <button type="button" className="btn btn-outline" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </div>

      {state?.error ? (
        <p
          role="alert"
          className="mt-4 border-l-2 border-red-400 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p
          role="status"
          className="mt-4 border-l-2 border-emerald-400 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {state.ok}
        </p>
      ) : null}
    </form>
  );
}

export function UsersManager({
  admins,
  currentId,
}: {
  admins: AdminRow[];
  currentId: number | null;
}) {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    createAdminAction,
    null
  );

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-3">Acesso</p>
          <h1 className="text-[36px] leading-tight sm:text-[44px]">Usuários</h1>
          <div className="rule-gold mt-5 w-32" />
          <p className="mt-4 max-w-xl text-[14px] text-espresso-soft/80">
            Cada pessoa tem o seu próprio login e senha para entrar no painel.
            Criou um login novo, é só compartilhar o endereço{" "}
            <strong className="text-espresso">/admin/login</strong> com a
            pessoa — os dois acessam ao mesmo tempo, cada um na sua sessão.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setCreating((v) => !v);
            setEditingId(null);
          }}
          className="btn btn-dark"
        >
          {creating ? "Fechar" : "+ Novo login"}
        </button>
      </header>

      {creating ? (
        <form action={formAction} className="mb-8 border border-gold/60 bg-white p-6">
          <h2 className="text-[23px] leading-tight">Criar login</h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="new-username">
                Usuário
              </label>
              <input
                id="new-username"
                name="username"
                className="field"
                autoComplete="off"
                placeholder="ex.: beatriz"
                required
              />
              <p className="mt-2 text-[12px] text-espresso-soft/75">
                Letras, números, ponto ou hífen — mínimo 3 caracteres.
              </p>
            </div>

            <div>
              <label className="field-label" htmlFor="new-password">
                Senha
              </label>
              <input
                id="new-password"
                name="password"
                type="password"
                className="field"
                autoComplete="new-password"
                placeholder="mínimo 8 caracteres"
                minLength={8}
                required
              />
            </div>
          </div>

          {state?.error ? (
            <p
              role="alert"
              className="mt-5 border-l-2 border-red-400 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {state.error}
            </p>
          ) : null}
          {state?.ok ? (
            <p
              role="status"
              className="mt-5 border-l-2 border-emerald-400 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
            >
              {state.ok}
            </p>
          ) : null}

          <div className="mt-6">
            <button type="submit" className="btn btn-gold" disabled={pending}>
              {pending ? "Criando..." : "Criar login"}
            </button>
          </div>
        </form>
      ) : null}

      <ul className="space-y-4">
        {admins.map((a) => {
          const isCurrent = a.id === currentId;
          const isEditing = editingId === a.id;

          return (
            <li key={a.id}>
              <article className="border border-champagne bg-white p-6">
                <div className="flex flex-wrap items-center justify-between gap-5">
                  <div className="min-w-[220px] flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-[23px] leading-tight">{a.username}</h2>
                      <span className="border border-gold/60 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.16em] text-gold-deep">
                        Ativo
                      </span>
                      {isCurrent ? (
                        <span className="border border-champagne px-2.5 py-0.5 text-[10px] uppercase tracking-[0.16em] text-espresso-soft/75">
                          Você
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-[13px] text-espresso-soft/75">
                      Entrou no painel com este login · criado em{" "}
                      {formatDay(a.created_at)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(isEditing ? null : a.id);
                        setCreating(false);
                      }}
                      className="btn btn-outline !px-5 !py-2.5 !text-[10px]"
                    >
                      {isEditing ? "Fechar" : "Alterar senha"}
                    </button>

                    {isCurrent ? null : (
                      <form
                        action={deleteAdminAction}
                        onSubmit={(e) => {
                          if (
                            !confirm(`Excluir o login "${a.username}"?`)
                          ) {
                            e.preventDefault();
                          }
                        }}
                      >
                        <input type="hidden" name="id" value={a.id} />
                        <button
                          type="submit"
                          className="btn btn-outline !px-5 !py-2.5 !text-[10px] !text-red-700 hover:!border-red-400 hover:!text-red-700"
                        >
                          Excluir
                        </button>
                      </form>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <PasswordForm
                    user={a}
                    onCancel={() => setEditingId(null)}
                  />
                ) : null}
              </article>
            </li>
          );
        })}
      </ul>

      {admins.length <= 1 ? (
        <p className="mt-6 border-l-2 border-gold/60 pl-5 text-[13px] leading-relaxed text-espresso-soft/75">
          Existe apenas um login. Crie um segundo em{" "}
          <strong className="text-espresso">+ Novo login</strong> para que mais
          uma pessoa possa entrar no painel.
        </p>
      ) : null}
    </div>
  );
}
