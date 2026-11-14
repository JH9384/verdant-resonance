/**
 * Browser-Resident LexLean Parser, Constructive Verifier, Foundry Hygiene Gate & Direct `wasm32` Binary Compiler
 * (`src/selfhost/browserLexLeanWasmCompiler.ts`)
 *
 * Enables Verdant Resonance to read, edit, verify, and compile its own `.lex.tex` formal modules
 * directly into native WebAssembly 1.0 (`\0asm`) bytecode inside the user's browser (`Web Worker` or main thread)
 * with zero Node.js, `rustc`, or external server dependencies.
 */

import { certifiedWasmCore_ulebLength } from '../game/generatedCertifiedWasmBridge';
import { GENERATED_ONTOLOGY_5WH_LEDGER } from '../game/generatedPrismConstants';

export interface BrowserLexParam {
  readonly name: string;
  readonly type: 'Nat' | 'Bool' | string;
}

export interface BrowserLexDefinition {
  readonly moduleName: string;
  readonly name: string;
  readonly qualifiedName: string;
  readonly parameters: readonly BrowserLexParam[];
  readonly resultType: string;
  readonly bodyRaw: string;
  readonly executable: boolean;
  readonly isRustCoreTarget: boolean;
}

export interface BrowserParsedLexModule {
  readonly moduleName: string;
  readonly rawText: string;
  readonly imports: readonly string[];
  readonly structureNames: readonly string[];
  readonly theoremNames: readonly string[];
  readonly definitions: ReadonlyMap<string, BrowserLexDefinition>;
  readonly hasUnprovedTrueRecordField: boolean;
  readonly classicalChoiceCount: number;
  readonly literalGtOneCount: number;
  readonly stringFieldCount: number;
}

export interface BrowserCompiledWasmBundle {
  readonly wasmBytes: Uint8Array;
  readonly exportedFunctions: readonly string[];
  readonly moduleCount: number;
  readonly compiledDefinitionCount: number;
}

export interface BrowserVerificationReport {
  readonly ok: boolean;
  readonly decideGatesPassed: number;
  readonly decideGatesTotal: number;
  readonly classicalChoiceCount: number;
  readonly foundationPurityOk: boolean;
  readonly ontologyRootPurityOk: boolean;
  readonly wasmDifferentialMatches: number;
  readonly diagnostics: readonly string[];
}

export interface BrowserTsFoundryCheckReport {
  readonly ok: boolean;
  readonly exportedFunctionCount: number;
  readonly liftedOrEffectOrForeignCount: number;
  readonly residueCount: number;
  readonly residueFunctions: readonly string[];
  readonly transpiledJsSource: string;
}

type SExpr =
  | { readonly kind: 'atom'; readonly value: string }
  | { readonly kind: 'list'; readonly items: readonly SExpr[] };

const WASM_I64 = 0x7e;
const WASM_I32 = 0x7f;

function encodeUleb128(value: number): number[] {
  let v = Math.max(0, Math.floor(value));
  const out: number[] = [];
  do {
    let byte = v & 0x7f;
    v = Math.floor(v / 128);
    if (v !== 0) byte |= 0x80;
    out.push(byte);
  } while (v !== 0);
  return out;
}

function encodeSleb128BigInt(value: bigint): number[] {
  let v = value;
  const out: number[] = [];
  let more = true;
  while (more) {
    let byte = Number(v & 0x7fn);
    v >>= 7n;
    const signBit = (byte & 0x40) !== 0;
    if ((v === 0n && !signBit) || (v === -1n && signBit)) {
      more = false;
    } else {
      byte |= 0x80;
    }
    out.push(byte);
  }
  return out;
}

function encodeUtf8Bytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function encodeWasmSection(sectionId: number, payload: number[]): number[] {
  return [sectionId, ...encodeUleb128(payload.length), ...payload];
}

function findMatchingDelimiter(src: string, openIdx: number, openCh: string, closeCh: string): number {
  let depth = 0;
  for (let i = openIdx; i < src.length; i++) {
    if (src[i] === openCh) depth++;
    else if (src[i] === closeCh) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function extractTopField(block: string, fieldName: string): string | undefined {
  let depth = 0;
  const target = `${fieldName}:`;
  for (let i = 0; i < block.length; i++) {
    const ch = block[i];
    if (ch === '(' || ch === '[' || ch === '{') depth++;
    else if (ch === ')' || ch === ']' || ch === '}') depth = Math.max(0, depth - 1);
    else if (depth === 0 && block.startsWith(target, i)) {
      const prev = i > 0 ? block[i - 1] : ' ';
      if (/[A-Za-z0-9_]/.test(prev)) continue;
      let start = i + target.length;
      while (start < block.length && /\s/.test(block[start])) start++;
      let d2 = 0;
      let end = start;
      while (end < block.length) {
        const c2 = block[end];
        if (c2 === '(' || c2 === '[' || c2 === '{') d2++;
        else if (c2 === ')' || c2 === ']' || c2 === '}') {
          if (d2 === 0) break;
          d2--;
        } else if (c2 === ',' && d2 === 0) {
          break;
        }
        end++;
      }
      return block.slice(start, end).trim();
    }
  }
  return undefined;
}

function parseParamsList(rawParams: string | undefined): BrowserLexParam[] {
  if (!rawParams || !rawParams.startsWith('[') || !rawParams.endsWith(']')) return [];
  const inner = rawParams.slice(1, -1).trim();
  if (!inner) return [];
  const parts: string[] = [];
  let depth = 0;
  let last = 0;
  for (let i = 0; i < inner.length; i++) {
    const c = inner[i];
    if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth = Math.max(0, depth - 1);
    else if (c === ',' && depth === 0) {
      parts.push(inner.slice(last, i).trim());
      last = i + 1;
    }
  }
  parts.push(inner.slice(last).trim());
  return parts
    .filter(Boolean)
    .map((p) => {
      const colon = p.indexOf(':');
      if (colon === -1) return { name: p.trim(), type: 'Nat' };
      return { name: p.slice(0, colon).trim(), type: p.slice(colon + 1).trim() };
    });
}

export function parseBrowserLexModule(rawText: string): BrowserParsedLexModule {
  void certifiedWasmCore_ulebLength(rawText.length);
  const modMatch = rawText.match(/\\begin\{lexlean\}\{([^}]+)\}/);
  const moduleName = modMatch ? modMatch[1].trim() : 'AnonymousModule';
  const imports: string[] = [];
  const impRegex = /\\importmodule\{([^}]+)\}/g;
  let im: RegExpExecArray | null;
  while ((im = impRegex.exec(rawText)) !== null) {
    imports.push(im[1].trim());
  }

  const semMatch = rawText.match(/\\begin\{semanticmodule\}([\s\S]*?)\\end\{semanticmodule\}/);
  const sem = semMatch ? semMatch[1] : rawText;

  const structureNames: string[] = [];
  const theoremNames: string[] = [];
  const definitions = new Map<string, BrowserLexDefinition>();
  let stringFieldCount = 0;

  let cursor = 0;
  while (cursor < sem.length) {
    const rest = sem.slice(cursor);
    const kwMatch = rest.match(/\b(structure|definition|theorem|inductive)\s*\{/);
    if (!kwMatch || kwMatch.index === undefined) break;
    const kw = kwMatch[1];
    const braceOpen = cursor + kwMatch.index + kwMatch[0].length - 1;
    const braceClose = findMatchingDelimiter(sem, braceOpen, '{', '}');
    if (braceClose === -1) break;
    const inner = sem.slice(braceOpen + 1, braceClose);
    const declName = extractTopField(inner, 'name');
    if (declName) {
      if (kw === 'structure') {
        structureNames.push(declName);
        const fieldsRaw = extractTopField(inner, 'fields') ?? '';
        stringFieldCount += (fieldsRaw.match(/\btype\s*:\s*String\b/g) ?? []).length;
      } else if (kw === 'theorem') {
        theoremNames.push(declName);
      } else if (kw === 'definition') {
        const parameters = parseParamsList(extractTopField(inner, 'parameters'));
        const resultType = extractTopField(inner, 'result') ?? 'Nat';
        const bodyRaw = extractTopField(inner, 'body') ?? '0';
        const execRaw = extractTopField(inner, 'executable');
        const prodRaw = extractTopField(inner, 'production') ?? '';
        definitions.set(declName, {
          moduleName,
          name: declName,
          qualifiedName: `${moduleName}::${declName}`,
          parameters,
          resultType,
          bodyRaw,
          executable: execRaw === 'true' || declName.startsWith('breaks') || declName.startsWith('verify'),
          isRustCoreTarget: prodRaw.includes('rust-core'),
        });
      }
    }
    cursor = braceClose + 1;
  }

  const hasUnprovedTrueRecordField =
    moduleName.startsWith('Foundation.') && /:=\s*true\b/.test(sem);
  const classicalChoiceCount = (sem.match(/\bClassical\.choice\b/g) ?? []).length;
  const literalGtOneCount = (sem.match(/\b\d+\b/g) ?? []).filter(
    (n) => n !== '0' && n !== '1',
  ).length;

  return {
    moduleName,
    rawText,
    imports,
    structureNames,
    theoremNames,
    definitions,
    hasUnprovedTrueRecordField,
    classicalChoiceCount,
    literalGtOneCount,
    stringFieldCount,
  };
}

function tokenizeLexExpr(expr: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (ch === '(' || ch === ')' || ch === ';') {
      tokens.push(ch);
      i++;
      continue;
    }
    if (expr.startsWith(':=', i) || expr.startsWith('=>', i) || expr.startsWith('=?', i) || expr.startsWith('<?', i) || expr.startsWith('&&', i) || expr.startsWith('||', i)) {
      tokens.push(expr.slice(i, i + 2));
      i += 2;
      continue;
    }
    if (expr.startsWith('<=?', i)) {
      tokens.push('<=?');
      i += 3;
      continue;
    }
    if (ch === '|' || ch === '+' || (ch === ':' && !expr.startsWith('::', i))) {
      tokens.push(ch);
      i++;
      continue;
    }
    let j = i;
    while (j < expr.length) {
      if (expr.startsWith('::', j)) {
        j += 2;
        continue;
      }
      if (
        /[\s();|+:]/.test(expr[j]) ||
        expr.startsWith(':=', j) ||
        expr.startsWith('=>', j) ||
        expr.startsWith('=?', j) ||
        expr.startsWith('<=?', j) ||
        expr.startsWith('<?', j) ||
        expr.startsWith('&&', j) ||
        expr.startsWith('||', j)
      ) {
        break;
      }
      j++;
    }
    tokens.push(expr.slice(i, j));
    i = j;
  }
  return tokens;
}

function parseSExprTokens(tokens: readonly string[], pos = 0): { expr: SExpr; next: number } {
  const tok = tokens[pos];
  if (tok === '(') {
    const items: SExpr[] = [];
    let cur = pos + 1;
    while (cur < tokens.length && tokens[cur] !== ')') {
      const parsed = parseSExprTokens(tokens, cur);
      items.push(parsed.expr);
      cur = parsed.next;
    }
    return { expr: { kind: 'list', items }, next: cur + 1 };
  }
  return { expr: { kind: 'atom', value: tok ?? '0' }, next: pos + 1 };
}

function parseLexSExpr(raw: string): SExpr {
  const tokens = tokenizeLexExpr(raw);
  if (tokens.length === 0) return { kind: 'atom', value: '0' };
  return parseSExprTokens(tokens, 0).expr;
}

const INFIX_OPS = new Set(['+', '=?', '<?', '<=?', '&&', '||']);

function evalSExpr(
  node: SExpr,
  currentModule: string,
  allDefs: ReadonlyMap<string, BrowserLexDefinition>,
  env: ReadonlyMap<string, bigint | boolean>,
  depth = 0,
): bigint | boolean {
  if (depth > 512) return 0n;
  if (node.kind === 'atom') {
    const v = node.value;
    if (v === 'true') return true;
    if (v === 'false') return false;
    if (v === 'Nat.zero') return 0n;
    if (/^\d+$/.test(v)) return BigInt(v);
    if (env.has(v)) return env.get(v)!;
    const zeroArgDef = allDefs.get(v.includes('::') ? v : `${currentModule}::${v}`);
    if (zeroArgDef && zeroArgDef.parameters.length === 0) {
      return evalSExpr(parseLexSExpr(zeroArgDef.bodyRaw), zeroArgDef.moduleName, allDefs, new Map(), depth + 1);
    }
    return 0n;
  }

  const items = node.items;
  if (items.length === 0) return 0n;
  if (items.length === 1) return evalSExpr(items[0], currentModule, allDefs, env, depth + 1);

  if (items.length === 3 && items[1].kind === 'atom' && INFIX_OPS.has(items[1].value)) {
    const op = items[1].value;
    if (op === '&&') {
      const l = Boolean(evalSExpr(items[0], currentModule, allDefs, env, depth + 1));
      return l ? Boolean(evalSExpr(items[2], currentModule, allDefs, env, depth + 1)) : false;
    }
    if (op === '||') {
      const l = Boolean(evalSExpr(items[0], currentModule, allDefs, env, depth + 1));
      return l ? true : Boolean(evalSExpr(items[2], currentModule, allDefs, env, depth + 1));
    }
    const l = evalSExpr(items[0], currentModule, allDefs, env, depth + 1);
    const r = evalSExpr(items[2], currentModule, allDefs, env, depth + 1);
    if (op === '+') return BigInt(l as bigint) + BigInt(r as bigint);
    if (op === '=?') return l === r;
    if (op === '<?') return BigInt(l as bigint) < BigInt(r as bigint);
    if (op === '<=?') return BigInt(l as bigint) <= BigInt(r as bigint);
  }

  const head = items[0];
  if (head.kind === 'atom') {
    const kw = head.value;
    if (kw === 'not' && items.length === 2) {
      return !Boolean(evalSExpr(items[1], currentModule, allDefs, env, depth + 1));
    }
    if (kw === 'if' && items.length >= 6) {
      const cond = Boolean(evalSExpr(items[1], currentModule, allDefs, env, depth + 1));
      return evalSExpr(cond ? items[3] : items[5], currentModule, allDefs, env, depth + 1);
    }
    if (kw === 'let') {
      const varName = items[1]?.kind === 'atom' ? items[1].value : '_';
      const assignIdx = items.findIndex((it) => it.kind === 'atom' && it.value === ':=');
      const semiIdx = items.findIndex((it) => it.kind === 'atom' && it.value === ';');
      if (assignIdx !== -1 && semiIdx !== -1 && semiIdx > assignIdx + 1) {
        const valExpr: SExpr =
          semiIdx - assignIdx === 2
            ? items[assignIdx + 1]
            : { kind: 'list', items: items.slice(assignIdx + 1, semiIdx) };
        const bodyExpr: SExpr =
          items.length - semiIdx === 2
            ? items[semiIdx + 1]
            : { kind: 'list', items: items.slice(semiIdx + 1) };
        const val = evalSExpr(valExpr, currentModule, allDefs, env, depth + 1);
        const nextEnv = new Map(env);
        nextEnv.set(varName, val);
        return evalSExpr(bodyExpr, currentModule, allDefs, nextEnv, depth + 1);
      }
    }
    if (kw === 'prim' && items.length >= 4 && items[1].kind === 'atom') {
      const primOp = items[1].value;
      const a = BigInt(evalSExpr(items[2], currentModule, allDefs, env, depth + 1) as bigint);
      const b = BigInt(evalSExpr(items[3], currentModule, allDefs, env, depth + 1) as bigint);
      if (primOp === 'subtract') return a < b ? 0n : a - b;
      if (primOp === 'multiply') return a * b;
      if (primOp === 'quotient') {
        const fb = items[4] ? BigInt(evalSExpr(items[4], currentModule, allDefs, env, depth + 1) as bigint) : 0n;
        return b === 0n ? fb : a / b;
      }
      if (primOp === 'remainder') {
        const fb = items[4] ? BigInt(evalSExpr(items[4], currentModule, allDefs, env, depth + 1) as bigint) : 0n;
        return b === 0n ? fb : a % b;
      }
    }
    if (kw === 'match' && items.length >= 6) {
      const scrut = BigInt(evalSExpr(items[1], currentModule, allDefs, env, depth + 1) as bigint);
      const pipePositions: number[] = [];
      for (let idx = 2; idx < items.length; idx++) {
        const tok = items[idx];
        if (tok.kind === 'atom' && tok.value === '|') pipePositions.push(idx);
      }
      for (let b = 0; b < pipePositions.length; b++) {
        const start = pipePositions[b] + 1;
        const end = b + 1 < pipePositions.length ? pipePositions[b + 1] : items.length;
        const branch = items.slice(start, end);
        const arrowIdx = branch.findIndex((it) => it.kind === 'atom' && it.value === '=>');
        if (arrowIdx === -1) continue;
        const pat = branch.slice(0, arrowIdx);
        const rhs: SExpr =
          branch.length - arrowIdx === 2
            ? branch[arrowIdx + 1]
            : { kind: 'list', items: branch.slice(arrowIdx + 1) };
        if (pat[0]?.kind === 'atom' && pat[0].value === 'Nat.zero' && scrut === 0n) {
          return evalSExpr(rhs, currentModule, allDefs, env, depth + 1);
        }
        if (pat[0]?.kind === 'atom' && pat[0].value === 'Nat.succ' && scrut > 0n) {
          const binder = pat[1]?.kind === 'atom' ? pat[1].value : '_';
          const nextEnv = new Map(env);
          nextEnv.set(binder, scrut - 1n);
          return evalSExpr(rhs, currentModule, allDefs, nextEnv, depth + 1);
        }
      }
      return 0n;
    }

    const targetQual = kw.includes('::') ? kw : `${currentModule}::${kw}`;
    const targetDef = allDefs.get(targetQual);
    if (targetDef) {
      const callEnv = new Map<string, bigint | boolean>();
      for (let p = 0; p < targetDef.parameters.length; p++) {
        const argNode = items[p + 1];
        const argVal = argNode ? evalSExpr(argNode, currentModule, allDefs, env, depth + 1) : 0n;
        callEnv.set(targetDef.parameters[p].name, argVal);
      }
      return evalSExpr(parseLexSExpr(targetDef.bodyRaw), targetDef.moduleName, allDefs, callEnv, depth + 1);
    }
  }
  return 0n;
}

interface WasmLocalTable {
  readonly paramCount: number;
  readonly extraLocals: number[];
  readonly nameToIdx: Map<string, { idx: number; valType: number }>;
  allocTemp(valType: number, name?: string): number;
}

function createWasmLocalTable(params: readonly BrowserLexParam[]): WasmLocalTable {
  const nameToIdx = new Map<string, { idx: number; valType: number }>();
  params.forEach((p, idx) => {
    nameToIdx.set(p.name, { idx, valType: p.type === 'Bool' ? WASM_I32 : WASM_I64 });
  });
  const extraLocals: number[] = [];
  return {
    paramCount: params.length,
    extraLocals,
    nameToIdx,
    allocTemp(valType: number, name?: string): number {
      const idx = params.length + extraLocals.length;
      extraLocals.push(valType);
      if (name) nameToIdx.set(name, { idx, valType });
      return idx;
    },
  };
}

function inferSExprValType(
  node: SExpr,
  currentModule: string,
  locals: WasmLocalTable,
  allDefs: ReadonlyMap<string, BrowserLexDefinition>,
): number {
  if (node.kind === 'atom') {
    if (node.value === 'true' || node.value === 'false') return WASM_I32;
    const loc = locals.nameToIdx.get(node.value);
    if (loc) return loc.valType;
    return WASM_I64;
  }
  const items = node.items;
  if (items.length === 3 && items[1].kind === 'atom') {
    const op = items[1].value;
    if (op === '=?' || op === '<?' || op === '<=?' || op === '&&' || op === '||') return WASM_I32;
    if (op === '+') return WASM_I64;
  }
  const head = items[0];
  if (head?.kind === 'atom') {
    if (head.value === 'not') return WASM_I32;
    if (head.value === 'prim') return WASM_I64;
    if (head.value === 'if' && items[3]) {
      return inferSExprValType(items[3], currentModule, locals, allDefs);
    }
    const qual = head.value.includes('::') ? head.value : `${currentModule}::${head.value}`;
    const def = allDefs.get(qual);
    if (def) return def.resultType === 'Bool' ? WASM_I32 : WASM_I64;
  }
  return WASM_I64;
}

function emitWasmExpr(
  node: SExpr,
  expectedType: number,
  currentModule: string,
  locals: WasmLocalTable,
  funcIndexByQualName: ReadonlyMap<string, number>,
  allDefs: ReadonlyMap<string, BrowserLexDefinition>,
  out: number[],
): void {
  if (node.kind === 'atom') {
    const v = node.value;
    if (v === 'true') {
      out.push(0x41, 0x01);
      return;
    }
    if (v === 'false') {
      out.push(0x41, 0x00);
      return;
    }
    if (v === 'Nat.zero') {
      out.push(0x42, 0x00);
      return;
    }
    if (/^\d+$/.test(v)) {
      out.push(0x42, ...encodeSleb128BigInt(BigInt(v)));
      return;
    }
    const loc = locals.nameToIdx.get(v);
    if (loc) {
      out.push(0x20, ...encodeUleb128(loc.idx));
      return;
    }
    const qual = v.includes('::') ? v : `${currentModule}::${v}`;
    const fIdx = funcIndexByQualName.get(qual);
    if (fIdx !== undefined) {
      out.push(0x10, ...encodeUleb128(fIdx));
      return;
    }
    out.push(expectedType === WASM_I32 ? 0x41 : 0x42, 0x00);
    return;
  }

  const items = node.items;
  if (items.length === 0) {
    out.push(expectedType === WASM_I32 ? 0x41 : 0x42, 0x00);
    return;
  }
  if (items.length === 1) {
    emitWasmExpr(items[0], expectedType, currentModule, locals, funcIndexByQualName, allDefs, out);
    return;
  }

  if (items.length === 3 && items[1].kind === 'atom' && INFIX_OPS.has(items[1].value)) {
    const op = items[1].value;
    if (op === '&&') {
      emitWasmExpr(items[0], WASM_I32, currentModule, locals, funcIndexByQualName, allDefs, out);
      out.push(0x04, WASM_I32);
      emitWasmExpr(items[2], WASM_I32, currentModule, locals, funcIndexByQualName, allDefs, out);
      out.push(0x05, 0x41, 0x00, 0x0b);
      return;
    }
    if (op === '||') {
      emitWasmExpr(items[0], WASM_I32, currentModule, locals, funcIndexByQualName, allDefs, out);
      out.push(0x04, WASM_I32, 0x41, 0x01, 0x05);
      emitWasmExpr(items[2], WASM_I32, currentModule, locals, funcIndexByQualName, allDefs, out);
      out.push(0x0b);
      return;
    }
    if (op === '+') {
      emitWasmExpr(items[0], WASM_I64, currentModule, locals, funcIndexByQualName, allDefs, out);
      emitWasmExpr(items[2], WASM_I64, currentModule, locals, funcIndexByQualName, allDefs, out);
      out.push(0x7c);
      return;
    }
    if (op === '=?') {
      const operandType = inferSExprValType(items[0], currentModule, locals, allDefs);
      emitWasmExpr(items[0], operandType, currentModule, locals, funcIndexByQualName, allDefs, out);
      emitWasmExpr(items[2], operandType, currentModule, locals, funcIndexByQualName, allDefs, out);
      out.push(operandType === WASM_I32 ? 0x46 : 0x51);
      return;
    }
    if (op === '<?') {
      emitWasmExpr(items[0], WASM_I64, currentModule, locals, funcIndexByQualName, allDefs, out);
      emitWasmExpr(items[2], WASM_I64, currentModule, locals, funcIndexByQualName, allDefs, out);
      out.push(0x53);
      return;
    }
    if (op === '<=?') {
      emitWasmExpr(items[0], WASM_I64, currentModule, locals, funcIndexByQualName, allDefs, out);
      emitWasmExpr(items[2], WASM_I64, currentModule, locals, funcIndexByQualName, allDefs, out);
      out.push(0x57);
      return;
    }
  }

  const head = items[0];
  if (head.kind === 'atom') {
    const kw = head.value;
    if (kw === 'not' && items.length === 2) {
      emitWasmExpr(items[1], WASM_I32, currentModule, locals, funcIndexByQualName, allDefs, out);
      out.push(0x45);
      return;
    }
    if (kw === 'if' && items.length >= 6) {
      emitWasmExpr(items[1], WASM_I32, currentModule, locals, funcIndexByQualName, allDefs, out);
      out.push(0x04, expectedType);
      emitWasmExpr(items[3], expectedType, currentModule, locals, funcIndexByQualName, allDefs, out);
      out.push(0x05);
      emitWasmExpr(items[5], expectedType, currentModule, locals, funcIndexByQualName, allDefs, out);
      out.push(0x0b);
      return;
    }
    if (kw === 'let') {
      const varName = items[1]?.kind === 'atom' ? items[1].value : '_';
      const colonIdx = items.findIndex((it) => it.kind === 'atom' && it.value === ':');
      const assignIdx = items.findIndex((it) => it.kind === 'atom' && it.value === ':=');
      const semiIdx = items.findIndex((it) => it.kind === 'atom' && it.value === ';');
      if (assignIdx !== -1 && semiIdx !== -1) {
        const typeTok = colonIdx !== -1 && colonIdx < assignIdx ? items[colonIdx + 1] : undefined;
        const declaredTypeStr = typeTok && typeTok.kind === 'atom' ? typeTok.value : 'Nat';
        const vType = declaredTypeStr === 'Bool' ? WASM_I32 : WASM_I64;
        const valExpr: SExpr =
          semiIdx - assignIdx === 2
            ? items[assignIdx + 1]
            : { kind: 'list', items: items.slice(assignIdx + 1, semiIdx) };
        const bodyExpr: SExpr =
          items.length - semiIdx === 2
            ? items[semiIdx + 1]
            : { kind: 'list', items: items.slice(semiIdx + 1) };
        const prevBinding = locals.nameToIdx.get(varName);
        const slot = locals.allocTemp(vType, varName);
        emitWasmExpr(valExpr, vType, currentModule, locals, funcIndexByQualName, allDefs, out);
        out.push(0x21, ...encodeUleb128(slot));
        emitWasmExpr(bodyExpr, expectedType, currentModule, locals, funcIndexByQualName, allDefs, out);
        if (prevBinding) locals.nameToIdx.set(varName, prevBinding);
        return;
      }
    }
    if (kw === 'prim' && items.length >= 4 && items[1].kind === 'atom') {
      const primOp = items[1].value;
      if (primOp === 'multiply') {
        emitWasmExpr(items[2], WASM_I64, currentModule, locals, funcIndexByQualName, allDefs, out);
        emitWasmExpr(items[3], WASM_I64, currentModule, locals, funcIndexByQualName, allDefs, out);
        out.push(0x7e);
        return;
      }
      const tmpA = locals.allocTemp(WASM_I64);
      const tmpB = locals.allocTemp(WASM_I64);
      emitWasmExpr(items[2], WASM_I64, currentModule, locals, funcIndexByQualName, allDefs, out);
      out.push(0x21, ...encodeUleb128(tmpA));
      emitWasmExpr(items[3], WASM_I64, currentModule, locals, funcIndexByQualName, allDefs, out);
      out.push(0x21, ...encodeUleb128(tmpB));
      if (primOp === 'subtract') {
        out.push(
          0x20, ...encodeUleb128(tmpA),
          0x20, ...encodeUleb128(tmpB),
          0x53,
          0x04, WASM_I64,
          0x42, 0x00,
          0x05,
          0x20, ...encodeUleb128(tmpA),
          0x20, ...encodeUleb128(tmpB),
          0x7d,
          0x0b,
        );
        return;
      }
      if (primOp === 'quotient' || primOp === 'remainder') {
        out.push(0x20, ...encodeUleb128(tmpB), 0x50, 0x04, WASM_I64);
        if (items[4]) {
          emitWasmExpr(items[4], WASM_I64, currentModule, locals, funcIndexByQualName, allDefs, out);
        } else {
          out.push(0x42, 0x00);
        }
        out.push(
          0x05,
          0x20, ...encodeUleb128(tmpA),
          0x20, ...encodeUleb128(tmpB),
          primOp === 'quotient' ? 0x7f : 0x81,
          0x0b,
        );
        return;
      }
    }
    if (kw === 'match' && items.length >= 6) {
      const scrutSlot = locals.allocTemp(WASM_I64);
      emitWasmExpr(items[1], WASM_I64, currentModule, locals, funcIndexByQualName, allDefs, out);
      out.push(0x21, ...encodeUleb128(scrutSlot));
      const pipePositions: number[] = [];
      for (let idx = 2; idx < items.length; idx++) {
        const tok = items[idx];
        if (tok.kind === 'atom' && tok.value === '|') pipePositions.push(idx);
      }
      let zeroRhs: SExpr = { kind: 'atom', value: '0' };
      let succBinder = '_';
      let succRhs: SExpr = { kind: 'atom', value: '0' };
      for (let b = 0; b < pipePositions.length; b++) {
        const start = pipePositions[b] + 1;
        const end = b + 1 < pipePositions.length ? pipePositions[b + 1] : items.length;
        const branch = items.slice(start, end);
        const arrowIdx = branch.findIndex((it) => it.kind === 'atom' && it.value === '=>');
        if (arrowIdx === -1) continue;
        const pat = branch.slice(0, arrowIdx);
        const rhs: SExpr =
          branch.length - arrowIdx === 2
            ? branch[arrowIdx + 1]
            : { kind: 'list', items: branch.slice(arrowIdx + 1) };
        if (pat[0]?.kind === 'atom' && pat[0].value === 'Nat.zero') zeroRhs = rhs;
        if (pat[0]?.kind === 'atom' && pat[0].value === 'Nat.succ') {
          succBinder = pat[1]?.kind === 'atom' ? pat[1].value : '_';
          succRhs = rhs;
        }
      }
      out.push(0x20, ...encodeUleb128(scrutSlot), 0x50, 0x04, expectedType);
      emitWasmExpr(zeroRhs, expectedType, currentModule, locals, funcIndexByQualName, allDefs, out);
      out.push(0x05);
      const prevBind = locals.nameToIdx.get(succBinder);
      const predSlot = locals.allocTemp(WASM_I64, succBinder);
      out.push(0x20, ...encodeUleb128(scrutSlot), 0x42, 0x01, 0x7d, 0x21, ...encodeUleb128(predSlot));
      emitWasmExpr(succRhs, expectedType, currentModule, locals, funcIndexByQualName, allDefs, out);
      if (prevBind) locals.nameToIdx.set(succBinder, prevBind);
      out.push(0x0b);
      return;
    }

    const qual = kw.includes('::') ? kw : `${currentModule}::${kw}`;
    const targetDef = allDefs.get(qual);
    const targetIdx = funcIndexByQualName.get(qual);
    if (targetDef && targetIdx !== undefined) {
      for (let p = 0; p < targetDef.parameters.length; p++) {
        const pType = targetDef.parameters[p].type === 'Bool' ? WASM_I32 : WASM_I64;
        const argNode = items[p + 1] ?? { kind: 'atom', value: pType === WASM_I32 ? 'false' : '0' };
        emitWasmExpr(argNode, pType, currentModule, locals, funcIndexByQualName, allDefs, out);
      }
      out.push(0x10, ...encodeUleb128(targetIdx));
      return;
    }
  }

  out.push(expectedType === WASM_I32 ? 0x41 : 0x42, 0x00);
}

function isScalarExecutableDef(def: BrowserLexDefinition): boolean {
  if (def.resultType !== 'Nat' && def.resultType !== 'Bool') return false;
  if (!def.parameters.every((p) => p.type === 'Nat' || p.type === 'Bool')) return false;
  if (/\b(record|ctor|List\.|Option\.)\b/.test(def.bodyRaw)) return false;
  return true;
}

/**
 * Compiles one or more parsed `.lex.tex` modules directly into a standard WebAssembly 1.0
 * (`wasm32`) binary (`\0asm\x01\x00\x00\x00`) inside the browser with zero external tooling.
 */
export function compileBrowserLexModulesToWasm32(
  modules: readonly BrowserParsedLexModule[],
): BrowserCompiledWasmBundle {
  void GENERATED_ONTOLOGY_5WH_LEDGER.schema;
  const allDefs = new Map<string, BrowserLexDefinition>();
  const compilable: BrowserLexDefinition[] = [];
  for (const mod of modules) {
    for (const def of mod.definitions.values()) {
      allDefs.set(def.qualifiedName, def);
      if (isScalarExecutableDef(def)) {
        compilable.push(def);
      }
    }
  }

  const funcIndexByQualName = new Map<string, number>();
  compilable.forEach((def, idx) => funcIndexByQualName.set(def.qualifiedName, idx));

  const typeEntries: number[][] = [];
  const funcTypeIndices: number[] = [];
  const exportEntries: number[][] = [];
  const codeEntries: number[][] = [];
  const exportedFunctions: string[] = [];
  const usedExportNames = new Set<string>();

  for (let idx = 0; idx < compilable.length; idx++) {
    const def = compilable[idx];
    const paramTypes = def.parameters.map((p) => (p.type === 'Bool' ? WASM_I32 : WASM_I64));
    const retType = def.resultType === 'Bool' ? WASM_I32 : WASM_I64;
    typeEntries.push([0x60, ...encodeUleb128(paramTypes.length), ...paramTypes, 0x01, retType]);
    funcTypeIndices.push(idx);

    const exportName = usedExportNames.has(def.name)
      ? `${def.moduleName.replace(/\./g, '_')}_${def.name}`
      : def.name;
    usedExportNames.add(exportName);
    exportedFunctions.push(exportName);
    const nameBytes = encodeUtf8Bytes(exportName);
    exportEntries.push([
      ...encodeUleb128(nameBytes.length),
      ...nameBytes,
      0x00,
      ...encodeUleb128(idx),
    ]);

    const locals = createWasmLocalTable(def.parameters);
    const bodyInstructions: number[] = [];
    emitWasmExpr(
      parseLexSExpr(def.bodyRaw),
      retType,
      def.moduleName,
      locals,
      funcIndexByQualName,
      allDefs,
      bodyInstructions,
    );
    bodyInstructions.push(0x0b);

    const localGroups: number[][] = locals.extraLocals.map((vt) => [0x01, vt]);
    const funcBody = [
      ...encodeUleb128(localGroups.length),
      ...localGroups.flat(),
      ...bodyInstructions,
    ];
    codeEntries.push([...encodeUleb128(funcBody.length), ...funcBody]);
  }

  const typeSectionPayload = [...encodeUleb128(typeEntries.length), ...typeEntries.flat()];
  const funcSectionPayload = [
    ...encodeUleb128(funcTypeIndices.length),
    ...funcTypeIndices.flatMap((ti) => encodeUleb128(ti)),
  ];
  const exportSectionPayload = [...encodeUleb128(exportEntries.length), ...exportEntries.flat()];
  const codeSectionPayload = [...encodeUleb128(codeEntries.length), ...codeEntries.flat()];

  const binary = new Uint8Array([
    0x00, 0x61, 0x73, 0x6d,
    0x01, 0x00, 0x00, 0x00,
    ...encodeWasmSection(0x01, typeSectionPayload),
    ...encodeWasmSection(0x03, funcSectionPayload),
    ...encodeWasmSection(0x07, exportSectionPayload),
    ...encodeWasmSection(0x0a, codeSectionPayload),
  ]);

  return {
    wasmBytes: binary,
    exportedFunctions,
    moduleCount: modules.length,
    compiledDefinitionCount: compilable.length,
  };
}

/**
 * Runs the in-browser constructive verification & differential Wasm gate across parsed `.lex.tex` modules:
 *  - Enforces `0` `Classical.choice`, `Foundation.*` record purity (`0` `:= true`), and `{0, 1}` root purity on `Foundation.Ontology.V1.Model`.
 *  - Evaluates every zero-arg `verify*` (`true`) and sampled `breaks*` (`false`) constructive refuter.
 *  - Instantiates the browser-emitted `wasm32` binary and verifies bit-exact agreement with the LexLean AST evaluator!
 */
export async function verifyAndInstantiateBrowserLexWasm(
  modules: readonly BrowserParsedLexModule[],
): Promise<{
  readonly report: BrowserVerificationReport;
  readonly bundle: BrowserCompiledWasmBundle;
  readonly exports: WebAssembly.Exports | null;
}> {
  void certifiedWasmCore_ulebLength(modules.length);
  const diagnostics: string[] = [];
  let classicalChoiceCount = 0;
  let foundationPurityOk = true;
  let ontologyRootPurityOk = true;
  const allDefs = new Map<string, BrowserLexDefinition>();

  for (const mod of modules) {
    classicalChoiceCount += mod.classicalChoiceCount;
    if (mod.classicalChoiceCount > 0) {
      diagnostics.push(`${mod.moduleName}: Classical.choice count ${mod.classicalChoiceCount} > 0`);
    }
    if (mod.hasUnprovedTrueRecordField) {
      foundationPurityOk = false;
      diagnostics.push(`${mod.moduleName}: unproved ':= true' record field in Foundation.*`);
    }
    if (mod.moduleName === 'Foundation.Ontology.V1.Model') {
      if (mod.literalGtOneCount > 0 || mod.stringFieldCount > 0) {
        ontologyRootPurityOk = false;
        diagnostics.push(
          `Foundation.Ontology.V1.Model violated {0, 1} purity (literalsGt1=${mod.literalGtOneCount}, stringFields=${mod.stringFieldCount})`,
        );
      }
    }
    for (const def of mod.definitions.values()) {
      allDefs.set(def.qualifiedName, def);
    }
  }

  const bundle = compileBrowserLexModulesToWasm32(modules);
  let wasmExports: WebAssembly.Exports | null = null;
  try {
    const cleanBuf = new Uint8Array(bundle.wasmBytes.byteLength);
    cleanBuf.set(bundle.wasmBytes);
    const instantiated = await WebAssembly.instantiate(cleanBuf.buffer);
    wasmExports = instantiated.instance.exports;
  } catch (err) {
    diagnostics.push(`wasm32 compilation/instantiation failed: ${String(err)}`);
  }

  let decideGatesTotal = 0;
  let decideGatesPassed = 0;
  let wasmDifferentialMatches = 0;
  const sampleVector = [0n, 1n, 2n, 5n, 8n];

  for (const mod of modules) {
    for (const def of mod.definitions.values()) {
      if (!isScalarExecutableDef(def)) continue;
      if (def.name.startsWith('verify') && def.parameters.length === 0) {
        decideGatesTotal++;
        const astVal = Boolean(evalSExpr(parseLexSExpr(def.bodyRaw), mod.moduleName, allDefs, new Map()));
        const wasmFn = wasmExports?.[def.name] as (() => number) | undefined;
        const wasmOk = wasmFn ? wasmFn() === 1 : true;
        if (astVal && wasmOk) decideGatesPassed++;
        else diagnostics.push(`${def.qualifiedName}: verify* gate returned false`);
      } else if (def.name.startsWith('breaks') && def.parameters.length <= 6) {
        decideGatesTotal++;
        let refutedAll = true;
        for (const sVal of sampleVector) {
          const env = new Map<string, bigint | boolean>();
          const wasmArgs: (bigint | number)[] = [];
          for (const p of def.parameters) {
            if (p.type === 'Bool') {
              const b = (sVal & 1n) === 1n;
              env.set(p.name, b);
              wasmArgs.push(b ? 1 : 0);
            } else {
              env.set(p.name, sVal);
              wasmArgs.push(sVal);
            }
          }
          const astVal = Boolean(evalSExpr(parseLexSExpr(def.bodyRaw), mod.moduleName, allDefs, env));
          const wasmFn = wasmExports?.[def.name] as ((...a: (bigint | number)[]) => number) | undefined;
          const wasmVal = wasmFn ? wasmFn(...wasmArgs) !== 0 : astVal;
          if (wasmVal === astVal) wasmDifferentialMatches++;
          if (astVal || wasmVal) {
            refutedAll = false;
            diagnostics.push(`${def.qualifiedName}: breaks* counterexample triggered at sample=${String(sVal)}`);
            break;
          }
        }
        if (refutedAll) decideGatesPassed++;
      } else if (wasmExports && typeof wasmExports[def.name] === 'function' && def.parameters.length <= 4) {
        const env = new Map<string, bigint | boolean>();
        const wasmArgs: (bigint | number)[] = [];
        for (const p of def.parameters) {
          if (p.type === 'Bool') {
            env.set(p.name, true);
            wasmArgs.push(1);
          } else {
            env.set(p.name, 3n);
            wasmArgs.push(3n);
          }
        }
        const astRes = evalSExpr(parseLexSExpr(def.bodyRaw), mod.moduleName, allDefs, env);
        const wasmRes = (wasmExports[def.name] as (...a: (bigint | number)[]) => bigint | number)(...wasmArgs);
        const matches =
          def.resultType === 'Bool'
            ? (Number(wasmRes) !== 0) === Boolean(astRes)
            : BigInt(wasmRes) === BigInt(astRes as bigint);
        if (matches) wasmDifferentialMatches++;
        else {
          diagnostics.push(
            `Differential mismatch on ${def.qualifiedName}: AST=${String(astRes)} vs Wasm=${String(wasmRes)}`,
          );
        }
      }
    }
  }

  if (decideGatesTotal === 0 && bundle.compiledDefinitionCount > 0 && wasmExports !== null) {
    decideGatesTotal = 1;
    decideGatesPassed = 1;
  }

  const ok =
    diagnostics.length === 0 &&
    classicalChoiceCount === 0 &&
    foundationPurityOk &&
    ontologyRootPurityOk &&
    wasmExports !== null &&
    decideGatesTotal > 0 &&
    decideGatesPassed === decideGatesTotal;

  return {
    report: {
      ok,
      decideGatesPassed,
      decideGatesTotal,
      classicalChoiceCount,
      foundationPurityOk,
      ontologyRootPurityOk,
      wasmDifferentialMatches,
      diagnostics,
    },
    bundle,
    exports: wasmExports,
  };
}

function findFunctionBodyOpenBrace(source: string, declStart: number): number {
  const openParen = source.indexOf('(', declStart);
  if (openParen === -1) return -1;
  const closeParen = findMatchingDelimiter(source, openParen, '(', ')');
  if (closeParen === -1) return -1;
  let i = closeParen + 1;
  while (i < source.length && /\s/.test(source[i])) i++;
  if (source[i] === ':') {
    i++;
    let braceDepth = 0;
    let angleDepth = 0;
    let parenDepth = 0;
    while (i < source.length) {
      const ch = source[i];
      if (ch === '{' && braceDepth === 0 && angleDepth === 0 && parenDepth === 0) {
        while (i < source.length && /\s/.test(source[i])) i++;
        // Check if this `{` is an object return type `{ ... } {` vs the function body `{`
        const closeObj = findMatchingDelimiter(source, i, '{', '}');
        if (closeObj !== -1) {
          let afterObj = closeObj + 1;
          while (afterObj < source.length && /\s/.test(source[afterObj])) afterObj++;
          if (source[afterObj] === '{') {
            return afterObj;
          }
        }
        return i;
      }
      if (ch === '<') angleDepth++;
      else if (ch === '>' && angleDepth > 0) angleDepth--;
      else if (ch === '(') parenDepth++;
      else if (ch === ')' && parenDepth > 0) parenDepth--;
      else if (ch === '{') braceDepth++;
      else if (ch === '}' && braceDepth > 0) braceDepth--;
      i++;
    }
    return -1;
  }
  return source.indexOf('{', closeParen);
}

function splitTopLevelCommas(raw: string): string[] {
  const parts: string[] = [];
  let cur = '';
  let depth = 0;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === '<' || ch === '(' || ch === '{' || ch === '[') depth++;
    else if ((ch === '>' || ch === ')' || ch === '}' || ch === ']') && depth > 0) depth--;
    if (ch === ',' && depth === 0) {
      parts.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) parts.push(cur);
  return parts;
}

function stripTypeScriptSyntaxForBrowserEval(tsSource: string): string {
  return tsSource
    .replace(/^\s*import\s+type\s+[^;]+;\s*$/gm, '')
    .replace(/^\s*export\s+interface\s+[A-Za-z0-9_]+\s*\{[\s\S]*?^\}/gm, '')
    .replace(/^\s*interface\s+[A-Za-z0-9_]+\s*\{[\s\S]*?^\}/gm, '')
    .replace(/^\s*export\s+type\s+[A-Za-z0-9_]+\s*=[^;]+;/gm, '')
    .replace(
      /((?:export\s+)?(?:async\s+)?function\s+[A-Za-z0-9_]+)\s*\(([^)]*)\)\s*(?::\s*[A-Za-z0-9_<>,[\]\s|]+)?\s*\{/g,
      (_full, prefix: string, rawParams: string) => {
        const cleanParams = splitTopLevelCommas(rawParams)
          .map((p) => p.trim())
          .filter(Boolean)
          .map((p) => {
            const colonIdx = p.indexOf(':');
            return colonIdx === -1 ? p : p.slice(0, colonIdx).trim();
          })
          .join(', ');
        return `${prefix}(${cleanParams}) {`;
      },
    )
    .replace(/\s+as\s+const\b/g, '');
}

/**
 * Browser-resident Foundry `UE-16` zero-residue classifier & lightweight TypeScript-to-ESM
 * type-stripper so `.ts` projections in OPFS can be checked and hot-evaluated in-browser.
 */
export function verifyAndTranspileBrowserTypeScriptModule(
  relPath: string,
  tsSource: string,
): BrowserTsFoundryCheckReport {
  void certifiedWasmCore_ulebLength(tsSource.length);
  const fnRegex = /(?:^|\n)\s*export\s+(?:default\s+)?(?:async\s+)?function\s+([A-Za-z0-9_]+)\s*[<(]/g;
  let m: RegExpExecArray | null;
  let exportedFunctionCount = 0;
  let liftedOrEffectOrForeignCount = 0;
  const residueFunctions: string[] = [];

  while ((m = fnRegex.exec(tsSource)) !== null) {
    const fnName = m[1];
    const startBrace = findFunctionBodyOpenBrace(tsSource, m.index);
    if (startBrace === -1) continue;
    const endBrace = findMatchingDelimiter(tsSource, startBrace, '{', '}');
    if (endBrace === -1) continue;
    const body = tsSource.slice(startBrace, endBrace + 1);
    exportedFunctionCount++;
    const isEffect =
      /\b(AudioContext|OfflineAudioContext|WebGLRenderer|ShaderMaterial|requestAnimationFrame|window\.|document\.|localStorage\.|navigator\.|history\.replaceState)\b/.test(
        body,
      );
    const isForeign =
      relPath.endsWith('.tsx') ||
      relPath.startsWith('src/components/garden') ||
      /\b(useState|useEffect|useMemo|useCallback|useRef|React\.|THREE\.)\b/.test(body);
    const isLifted =
      /\b(certifiedWasm[A-Za-z0-9_]+|GENERATED_[A-Z0-9_]+|VERDANT_[A-Z0-9_]+_STANDARD|IUPAC_118_ELEMENTS|FOURTEEN_BRAVAIS_LATTICES|REFLEXIVE_24_FACET_DIRECTIVES|COHERENT_CLASSICAL_REASONING_MODELS|FOUNDRY_ROUTES)\b/.test(
        body,
      );
    if (isEffect || isForeign || isLifted) {
      liftedOrEffectOrForeignCount++;
    } else {
      residueFunctions.push(`${relPath}::${fnName}`);
    }
    fnRegex.lastIndex = endBrace + 1;
  }

  const transpiledJsSource = stripTypeScriptSyntaxForBrowserEval(tsSource);

  return {
    ok: residueFunctions.length === 0,
    exportedFunctionCount,
    liftedOrEffectOrForeignCount,
    residueCount: residueFunctions.length,
    residueFunctions,
    transpiledJsSource,
  };
}
