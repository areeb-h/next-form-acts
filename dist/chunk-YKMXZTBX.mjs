import {
  useActionForm
} from "./chunk-QUMLUPGE.mjs";

// src/form/index.tsx
import React, { createContext, useContext, forwardRef } from "react";
var FormContext = createContext(null);
var Form = forwardRef(
  ({ action, schema, onSuccess, onError, children, mode = "auto", ...props }, ref) => {
    const isUrl = typeof action === "string";
    const resolvedMode = mode === "auto" ? isUrl ? "url" : "action" : mode;
    if (resolvedMode === "url") {
      return /* @__PURE__ */ React.createElement("form", { ref, action, method: "get", ...props }, children);
    }
    const { formAction, pending, errors, state } = useActionForm({
      action,
      schema,
      onSuccess,
      onError
    });
    return /* @__PURE__ */ React.createElement(FormContext.Provider, { value: { errors, pending, state } }, /* @__PURE__ */ React.createElement("form", { ref, action: formAction, ...props }, children));
  }
);
Form.displayName = "Form";
var Field = forwardRef(
  ({ name, label, error, required, children, ...rest }, ref) => {
    var _a;
    const ctx = useContext(FormContext);
    const fieldError = error ?? ((_a = ctx == null ? void 0 : ctx.errors) == null ? void 0 : _a[name]);
    const baseProps = children.props ?? {};
    const child = React.cloneElement(
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
    return /* @__PURE__ */ React.createElement("div", { ref, ...rest }, label && /* @__PURE__ */ React.createElement("label", { htmlFor: name, className: "block text-sm font-medium mb-1" }, label, required && /* @__PURE__ */ React.createElement("span", { className: "text-red-500 ml-1" }, "*")), child, fieldError && /* @__PURE__ */ React.createElement("span", { id: `${name}-error`, role: "alert", className: "text-sm text-red-600 mt-1 block" }, fieldError));
  }
);
Field.displayName = "Field";
var Submit = forwardRef(
  ({ children, loadingText = "Saving\u2026", loadingIcon, disabled, ...rest }, ref) => {
    const ctx = useContext(FormContext);
    const isPending = (ctx == null ? void 0 : ctx.pending) ?? false;
    return /* @__PURE__ */ React.createElement("button", { ref, type: "submit", disabled: disabled || isPending, ...rest }, isPending ? /* @__PURE__ */ React.createElement("span", { className: "inline-flex items-center gap-2" }, loadingIcon, loadingText) : children);
  }
);
Submit.displayName = "Submit";
function FormStatus({
  successMessage = "Success!",
  className = "mt-2 text-sm"
}) {
  const ctx = useContext(FormContext);
  if (!ctx) return null;
  const { state } = ctx;
  if (!state.ok && !state.message && !state.fieldErrors) return null;
  return /* @__PURE__ */ React.createElement("div", { className, role: "status" }, state.ok ? /* @__PURE__ */ React.createElement("span", { className: "text-green-600" }, "\u2713 ", state.message || successMessage) : /* @__PURE__ */ React.createElement("span", { className: "text-red-600" }, "\u2717 ", state.message || "Failed"));
}
function SearchForm({
  action,
  placeholder = "Search\u2026",
  className,
  children
}) {
  return /* @__PURE__ */ React.createElement(Form, { action, mode: "url", className }, /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement(Field, { name: "q" }, /* @__PURE__ */ React.createElement("input", { type: "search", placeholder, className: "flex-1 px-3 py-2 border rounded-md" })), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "px-4 py-2 bg-blue-600 text-white rounded-md" }, "Search")), children);
}
function FilterForm({
  schema,
  className,
  children
}) {
  return /* @__PURE__ */ React.createElement("form", { className }, children);
}

export {
  Form,
  Field,
  Submit,
  FormStatus,
  SearchForm,
  FilterForm
};
