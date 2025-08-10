"use client";
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

// src/form/index.tsx
var form_exports = {};
__export(form_exports, {
  Field: () => Field,
  FilterForm: () => FilterForm,
  Form: () => Form,
  FormStatus: () => FormStatus,
  SearchForm: () => SearchForm,
  Submit: () => Submit
});
module.exports = __toCommonJS(form_exports);
var import_react3 = __toESM(require("react"));

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

// src/form/index.tsx
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Field,
  FilterForm,
  Form,
  FormStatus,
  SearchForm,
  Submit
});
