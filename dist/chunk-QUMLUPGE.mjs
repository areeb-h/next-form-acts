import {
  normalizeFieldErrors
} from "./chunk-EM2PF6AC.mjs";

// src/client/index.ts
import {
  useActionState,
  useOptimistic as useOptimisticReact,
  startTransition
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
function useActionForm(options) {
  const {
    action,
    schema,
    onSuccess,
    onError,
    initialState = { ok: false }
  } = options;
  const [state, formAction, pending] = useActionState(
    async (_prev, formData) => {
      let input = formData;
      if (schema) {
        const obj = Object.fromEntries(formData.entries());
        const parsed = await schema.safeParseAsync(obj);
        if (!parsed.success) {
          return {
            ok: false,
            message: "Validation failed",
            fieldErrors: normalizeFieldErrors(
              parsed.error.flatten().fieldErrors
            )
          };
        }
        input = parsed.data;
      }
      const result = await action(input);
      if (result.ok) onSuccess == null ? void 0 : onSuccess(result);
      else onError == null ? void 0 : onError(result);
      return result;
    },
    initialState
  );
  const errors = useMemo(() => {
    if (state.ok || !state.fieldErrors) return {};
    return Object.fromEntries(
      Object.entries(state.fieldErrors).map(([k, v]) => [
        k,
        (v == null ? void 0 : v[0]) ?? "Invalid"
      ])
    );
  }, [state]);
  return { formAction, pending, errors, state };
}
function useOptimisticList(initial) {
  const [list, apply] = useOptimisticReact(
    initial,
    (state, action) => {
      switch (action == null ? void 0 : action.type) {
        case "add":
          return [action.item, ...state];
        case "update":
          return state.map(
            (it) => it.id === action.id ? { ...it, ...action.updates } : it
          );
        case "remove":
          return state.filter((it) => it.id !== action.id);
        case "replace":
          return action.items;
        default:
          return state;
      }
    }
  );
  const mutate = {
    add: (item) => apply({ type: "add", item }),
    update: (id, updates) => apply({ type: "update", id, updates }),
    remove: (id) => apply({ type: "remove", id }),
    replace: (items) => apply({ type: "replace", items }),
    custom: (action) => apply(action)
  };
  return [list, mutate];
}
function useURLFilters(schema) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filters = useMemo(() => {
    const raw = Object.fromEntries(
      searchParams.entries()
    );
    for (const k of Object.keys(raw)) {
      if (typeof raw[k] === "string" && raw[k].includes(",")) {
        raw[k] = raw[k].split(",").filter(Boolean);
      }
    }
    const res = schema.safeParse(raw);
    return res.success ? res.data : schema.parse({});
  }, [searchParams, schema]);
  const setFilters = useCallback(
    (updates) => {
      startTransition(() => {
        const next = { ...filters, ...updates };
        const params = new URLSearchParams();
        Object.entries(next).forEach(([k, v]) => {
          if (v === void 0 || v === null) return;
          if (Array.isArray(v)) {
            if (v.length) params.set(k, v.join(","));
          } else if (v !== "") {
            params.set(k, String(v));
          }
        });
        router.push(`?${params.toString()}`);
      });
    },
    [filters, router]
  );
  const clear = useCallback(() => router.push("?"), [router]);
  const searchAction = useCallback(
    (formData) => {
      const obj = Object.fromEntries(
        formData.entries()
      );
      setFilters(obj);
    },
    [setFilters]
  );
  const toggleInArray = useCallback(
    (key, value) => {
      const curr = filters[key] || [];
      const exists = curr.includes(value);
      const next = exists ? curr.filter((v) => v !== value) : [...curr, value];
      setFilters({ [key]: next });
    },
    [filters, setFilters]
  );
  return { filters, setFilters, clear, searchAction, toggleInArray };
}

export {
  useActionForm,
  useOptimisticList,
  useURLFilters
};
