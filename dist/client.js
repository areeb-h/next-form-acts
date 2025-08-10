"use client";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.ts
var client_exports = {};
__export(client_exports, {
  useActionForm: () => useActionForm,
  useOptimisticList: () => useOptimisticList,
  useURLFilters: () => useURLFilters
});
module.exports = __toCommonJS(client_exports);
var import_react = require("react");
var import_navigation = require("next/navigation");
var import_react2 = require("react");

// src/shared/normalizeFieldErrors.ts
function normalizeFieldErrors(src) {
  const out = {};
  for (const [k, v] of Object.entries(src)) {
    if (v && v.length) out[String(k)] = v;
  }
  return out;
}

// src/client/index.ts
function useActionForm(options) {
  const {
    action,
    schema,
    onSuccess,
    onError,
    initialState = { ok: false }
  } = options;
  const [state, formAction, pending] = (0, import_react.useActionState)(
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
  const errors = (0, import_react2.useMemo)(() => {
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
  const [list, apply] = (0, import_react.useOptimistic)(
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
  const router = (0, import_navigation.useRouter)();
  const searchParams = (0, import_navigation.useSearchParams)();
  const filters = (0, import_react2.useMemo)(() => {
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
  const setFilters = (0, import_react2.useCallback)(
    (updates) => {
      (0, import_react.startTransition)(() => {
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
  const clear = (0, import_react2.useCallback)(() => router.push("?"), [router]);
  const searchAction = (0, import_react2.useCallback)(
    (formData) => {
      const obj = Object.fromEntries(
        formData.entries()
      );
      setFilters(obj);
    },
    [setFilters]
  );
  const toggleInArray = (0, import_react2.useCallback)(
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  useActionForm,
  useOptimisticList,
  useURLFilters
});
