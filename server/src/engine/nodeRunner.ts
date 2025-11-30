/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-implied-eval */
import { GeminiAI } from "./gemini";

// hàm xác định kiểu dữ liệu của một giá trị bất kỳ
function typeOf(v: unknown) {
    return v === null ? "null" : Array.isArray(v) ? "array" : typeof v;
}

function wrapCompileError(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  throw new Error(`[CompileError] ${msg}`);
}
function wrapRuntimeError(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  throw new Error(`[RuntimeError] ${msg}`);
}
function inputGuard(input: unknown) {
  if (input === undefined) throw new Error(`[InputError] "data" is undefined`);
  if (input === null) throw new Error(`[InputError] "data" is null`);
  if (typeof input !== "object") {
    throw new Error(`[InputError] "data" must be an object, got ${typeOf(input)}`);
  }
}

// Thực thi script trả về OBJECT (cho scriptNode)
export async function runScriptNode(source: string | undefined,input: Record<string, unknown>): Promise<Record<string, unknown>> {
  inputGuard(input);

  const code = (source ?? "").trim();
  // khai bao la 1 ham nhan vao data
  let fn: (data: Record<string, unknown>) => unknown;

  try {
    if (/function\s+edit\s*\(\s*data\s*\)/.test(code)) {
      const wrapped = `"use strict";
                        ${code}
                        if (typeof edit !== 'function') { throw new Error('edit is not a function'); }
                        return edit(data);`;
      fn = new Function("data", wrapped) as (data: Record<string, unknown>) => unknown;
    } else {
      const body = code && code.includes("return") ? code : (code ? `return (${code});` : "return data;");
      const wrapped = `"use strict";
                        ${body}`;
      fn = new Function("data", wrapped) as (data: Record<string, unknown>) => unknown;
    }
  } catch (e) {
    fn = () => false;
    wrapCompileError(e);
  }

  let out: unknown;
  try {
    out = await fn(input);
  } catch (e) {
    wrapRuntimeError(e);
  }

  // kiểm tra kết quả cuối cùng
  if (typeof out !== "object" || out === null || Array.isArray(out)) {
    // kiểu thực tế trả về nếu lỗi
    throw new Error(`[OutputTypeError] scriptNode must return an object, got ${typeOf(out)}`);
  }
  return out as Record<string, unknown>;
}

// Thực thi script trả về BOOLEAN (cho conditionalNode)
export async function runConditionNode(source: string | undefined,input: Record<string, unknown>): Promise<boolean> {
  inputGuard(input);

  const code = (source ?? "").trim();
  let fn: (data: Record<string, unknown>) => unknown;

  try {
    if (/function\s+\w+\s*\(\s*data\s*\)/.test(code)) {
      const wrapped = `"use strict";
                        ${code}
                        const __f = (typeof edit === 'function') ? edit : (typeof check === 'function' ? check : undefined);
                        if (typeof __f !== 'function') { 
                        throw new Error('No boolean function found (edit/check)');
                        }
                        return __f(data);`;
      fn = new Function("data", wrapped) as (data: Record<string, unknown>) => unknown;
    } else {
      const body = code && code.includes("return") ? code : (code ? `return (${code});` : "return true;");
      const wrapped = `"use strict";
                        ${body}`;
      fn = new Function("data", wrapped) as (data: Record<string, unknown>) => unknown;
    }
  } catch (e) {
    wrapCompileError(e);
    fn = () => false;
  }

  let out: unknown;
  try {
    out = await fn(input);
  } catch (e) {
    wrapRuntimeError(e);
  }

  if (typeof out !== "boolean") {
    throw new Error(`[OutputTypeError] conditionalNode must return a boolean, got ${typeOf(out)}`);
  }
  return out;
}

function handlePrompt(data: Record<string, unknown>, prompt: string) {
  const result = prompt.replace(/\$\{([^}]+)\}/g, (_, expr) => {
    try {
      return new Function("data", `return ${expr}`)(data);
    } catch {
      return prompt; // nếu lỗi 
    }
  });

  return result;
}

export async function runAINode(data: Record<string, unknown>, prompt: string, result_field: string) : Promise<Record<string, unknown>>{
  try {
    const final_prompt = handlePrompt(data, prompt);

    const geminiAI = new GeminiAI();
    const result = await geminiAI.generate(final_prompt);

    data[result_field] = result;
    return data;
  } catch (err) {
    throw new Error(`[RunAINodeError] ${(err as Error)?.message || String(err)}`);
  }
}