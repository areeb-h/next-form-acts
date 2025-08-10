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

// src/server/index.ts
var server_exports = {};
__export(server_exports, {
  defineAction: () => defineAction,
  defineCRUD: () => defineCRUD,
  init: () => init,
  middleware: () => middleware
});
module.exports = __toCommonJS(server_exports);
var import_cache = require("next/cache");
var import_navigation = require("next/navigation");
var import_zod = require("zod");

// src/shared/normalizeFieldErrors.ts
function normalizeFieldErrors(src) {
  const out = {};
  for (const [k, v] of Object.entries(src)) {
    if (v && v.length) out[String(k)] = v;
  }
  return out;
}

// src/server/index.ts
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
        redirect: async (path) => (0, import_navigation.redirect)(path),
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
  defineAction,
  defineCRUD,
  init,
  middleware
});
