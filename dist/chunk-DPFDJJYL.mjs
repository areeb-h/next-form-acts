import {
  normalizeFieldErrors
} from "./chunk-EM2PF6AC.mjs";

// src/server/index.ts
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect as nextRedirect } from "next/navigation";
import { z } from "zod";
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
          for (const p of paths) revalidatePath(p);
        },
        revalidateTag: async (tag) => revalidateTag(tag),
        redirect: async (path) => nextRedirect(path),
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
      if (err instanceof z.ZodError) {
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
      schema: schema.partial().extend({ id: z.string() }),
      handler: async ({ input, ctx }) => {
        var _a;
        await ((_a = opts.onUpdate) == null ? void 0 : _a.call(opts, input, ctx));
        await revalidateAll(ctx);
        return { ok: true, message: "Updated successfully" };
      }
    }),
    delete: defineAction({
      schema: z.object({ id: z.string() }),
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

export {
  init,
  defineAction,
  defineCRUD,
  middleware
};
