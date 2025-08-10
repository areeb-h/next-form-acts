var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  Field: () => Field,
  FilterForm: () => FilterForm,
  Form: () => Form,
  FormStatus: () => FormStatus,
  SearchForm: () => SearchForm,
  Submit: () => Submit,
  defineAction: () => defineAction,
  defineCRUD: () => defineCRUD,
  init: () => init,
  middleware: () => middleware,
  useActionForm: () => useActionForm,
  useOptimisticList: () => useOptimisticList,
  useURLFilters: () => useURLFilters
});
module.exports = __toCommonJS(src_exports);

// src/client/index.ts
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

// src/form/index.tsx
var import_react3 = __toESM(require("react"));
var FormContext = (0, import_react3.createContext)(null);
var Form = (0, import_react3.forwardRef)(
  ({ action, schema, onSuccess, onError, children, mode = "auto", ...props }, ref) => {
    const isUrl = typeof action === "string";
    const resolvedMode = mode === "auto" ? isUrl ? "url" : "action" : mode;
    if (resolvedMode === "url") {
      return /* @__PURE__ */ import_react3.default.createElement("form", { ref, action, method: "get", ...props }, children);
    }
    const { formAction, pending, errors, state } = useActionForm({
      action,
      schema,
      onSuccess,
      onError
    });
    return /* @__PURE__ */ import_react3.default.createElement(FormContext.Provider, { value: { errors, pending, state } }, /* @__PURE__ */ import_react3.default.createElement("form", { ref, action: formAction, ...props }, children));
  }
);
Form.displayName = "Form";
var Field = (0, import_react3.forwardRef)(
  ({ name, label, error, required, children, ...rest }, ref) => {
    var _a;
    const ctx = (0, import_react3.useContext)(FormContext);
    const fieldError = error ?? ((_a = ctx == null ? void 0 : ctx.errors) == null ? void 0 : _a[name]);
    const baseProps = children.props ?? {};
    const child = import_react3.default.cloneElement(
      children,
      // <-- tell TS props are a string-keyed object
      {
        ...baseProps,
        name,
        id: name,
        required,
        "aria-invalid": !!fieldError,
        "aria-describedby": fieldError ? `${name}-error` : void 0
      }
    );
    return /* @__PURE__ */ import_react3.default.createElement("div", { ref, ...rest }, label && /* @__PURE__ */ import_react3.default.createElement("label", { htmlFor: name, className: "block text-sm font-medium mb-1" }, label, required && /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-red-500 ml-1" }, "*")), child, fieldError && /* @__PURE__ */ import_react3.default.createElement("span", { id: `${name}-error`, role: "alert", className: "text-sm text-red-600 mt-1 block" }, fieldError));
  }
);
Field.displayName = "Field";
var Submit = (0, import_react3.forwardRef)(
  ({ children, loadingText = "Saving\u2026", loadingIcon, disabled, ...rest }, ref) => {
    const ctx = (0, import_react3.useContext)(FormContext);
    const isPending = (ctx == null ? void 0 : ctx.pending) ?? false;
    return /* @__PURE__ */ import_react3.default.createElement("button", { ref, type: "submit", disabled: disabled || isPending, ...rest }, isPending ? /* @__PURE__ */ import_react3.default.createElement("span", { className: "inline-flex items-center gap-2" }, loadingIcon, loadingText) : children);
  }
);
Submit.displayName = "Submit";
function FormStatus({
  successMessage = "Success!",
  className = "mt-2 text-sm"
}) {
  const ctx = (0, import_react3.useContext)(FormContext);
  if (!ctx) return null;
  const { state } = ctx;
  if (!state.ok && !state.message && !state.fieldErrors) return null;
  return /* @__PURE__ */ import_react3.default.createElement("div", { className, role: "status" }, state.ok ? /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-green-600" }, "\u2713 ", state.message || successMessage) : /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-red-600" }, "\u2717 ", state.message || "Failed"));
}
function SearchForm({
  action,
  placeholder = "Search\u2026",
  className,
  children
}) {
  return /* @__PURE__ */ import_react3.default.createElement(Form, { action, mode: "url", className }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ import_react3.default.createElement(Field, { name: "q" }, /* @__PURE__ */ import_react3.default.createElement("input", { type: "search", placeholder, className: "flex-1 px-3 py-2 border rounded-md" })), /* @__PURE__ */ import_react3.default.createElement("button", { type: "submit", className: "px-4 py-2 bg-blue-600 text-white rounded-md" }, "Search")), children);
}
function FilterForm({
  schema,
  className,
  children
}) {
  return /* @__PURE__ */ import_react3.default.createElement("form", { className }, children);
}

// src/server/index.ts
var import_cache = require("next/cache");
var import_navigation2 = require("next/navigation");
var import_zod = require("zod");
var globalContext = {};
function init(context = {}) {
  globalContext = { ...globalContext, ...context };
  return globalContext;
}
function fdToObject(formData) {
  const obj = {};
  for (const [key, value] of formData.entries()) {
    if (key.endsWith("[]")) {
      const k = key.slice(0, -2);
      obj[k] = Array.isArray(obj[k]) ? [...obj[k], value] : [value];
      continue;
    }
    if (key in obj) {
      const prev = obj[key];
      obj[key] = Array.isArray(prev) ? [...prev, value] : [prev, value];
      continue;
    }
    if (typeof value === "string" && (value.startsWith("{") && value.endsWith("}") || value.startsWith("[") && value.endsWith("]"))) {
      try {
        obj[key] = JSON.parse(value);
      } catch {
        obj[key] = value;
      }
    } else {
      obj[key] = value;
    }
  }
  return obj;
}
function defineAction(opts) {
  return async function action(prevOrInput, formDataOrMeta) {
    var _a;
    try {
      let input;
      let meta;
      if (prevOrInput instanceof FormData) {
        input = fdToObject(prevOrInput);
        meta = formDataOrMeta;
      } else if (formDataOrMeta instanceof FormData) {
        input = fdToObject(formDataOrMeta);
      } else if (typeof prevOrInput === "object" && prevOrInput && "ok" in prevOrInput) {
        throw new Error("Invalid action call signature");
      } else {
        input = prevOrInput;
        meta = formDataOrMeta;
      }
      const parsed = await opts.schema.parseAsync(input);
      let ctx = {
        revalidate: async (paths) => {
          for (const p of paths) (0, import_cache.revalidatePath)(p);
        },
        revalidateTag: async (tag) => (0, import_cache.revalidateTag)(tag),
        redirect: async (path) => (0, import_navigation2.redirect)(path),
        now: () => /* @__PURE__ */ new Date(),
        ...globalContext
      };
      if ((_a = opts.middleware) == null ? void 0 : _a.length) {
        for (const mw of opts.middleware) {
          const res = await mw(ctx);
          if (res) ctx = res;
        }
      }
      return await opts.handler({ input: parsed, ctx, meta });
    } catch (err) {
      if (err instanceof import_zod.z.ZodError) {
        const fieldErrors = normalizeFieldErrors(err.flatten().fieldErrors);
        return { ok: false, message: "Validation failed", fieldErrors };
      }
      return { ok: false, message: err instanceof Error ? err.message : "Unknown error" };
    }
  };
}
function defineCRUD(opts) {
  const { schema, tags = [] } = opts;
  const revalidateAll = async (ctx) => {
    for (const t of tags) await ctx.revalidateTag(t);
  };
  return {
    create: defineAction({
      schema,
      handler: async ({ input, ctx }) => {
        var _a;
        await ((_a = opts.onCreate) == null ? void 0 : _a.call(opts, input, ctx));
        await revalidateAll(ctx);
        return { ok: true, message: "Created successfully" };
      }
    }),
    update: defineAction({
      schema: schema.partial().extend({ id: import_zod.z.string() }),
      handler: async ({ input, ctx }) => {
        var _a;
        await ((_a = opts.onUpdate) == null ? void 0 : _a.call(opts, input, ctx));
        await revalidateAll(ctx);
        return { ok: true, message: "Updated successfully" };
      }
    }),
    delete: defineAction({
      schema: import_zod.z.object({ id: import_zod.z.string() }),
      handler: async ({ input, ctx }) => {
        var _a;
        await ((_a = opts.onDelete) == null ? void 0 : _a.call(opts, input.id, ctx));
        await revalidateAll(ctx);
        return { ok: true, message: "Deleted successfully" };
      }
    })
  };
}
var middleware = {
  auth: (check) => async (ctx) => {
    const ok = await check(ctx);
    if (!ok) throw new Error("Unauthorized");
    return ctx;
  },
  log: (label) => async (ctx) => {
    console.log(label ?? "Action executed", { at: ctx.now().toISOString() });
    return ctx;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Field,
  FilterForm,
  Form,
  FormStatus,
  SearchForm,
  Submit,
  defineAction,
  defineCRUD,
  init,
  middleware,
  useActionForm,
  useOptimisticList,
  useURLFilters
});
