import type { ReactNode } from 'react'

export type ParamType = "number" | "string" | "boolean" | "option" | "group";

export type ParamDef = {
  name: string;
  dsc?: string;
  type: ParamType;
  required?: boolean;
  prefix?: string;
  options?: string[];
  defaultValue?: any;
  children?: ParamDef[];
};

export type CommandType = {
  name: string;
  dsc?: string;
  alias?: string[];
  param?: ParamDef[];
  ignoreInHelp?: boolean;
  action: (param: Record<string, any>) => void | Promise<void>;
};

export type setCustomCommandType = (
  log: (msg: ReactNode) => Promise<void>,
  editLastLine: (msg: ReactNode) => Promise<void>,
  removeLastLine: () => void,
  runCommand: (input: string) => Promise<void>,
  typeWriterEffect: (text: string, time?: number | undefined) => Promise<void>,
) => CommandType[]

export function tokenize(input: string): string[] {
  const regex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
  const tokens: string[] = [];
  let match;
  while ((match = regex.exec(input)) !== null) {
    tokens.push(match[1] ?? match[2] ?? match[0]);
  }
  return tokens;
}

function parseValue(value: string, def: ParamDef): any {
  if (def.type === "number") {
    const n = Number(value);
    return isNaN(n) ? (def.defaultValue ?? 0) : n;
  }
  if (def.type === "boolean") {
    return ["true", "1", "yes", "on"].includes(value?.toLowerCase());
  }
  if (def.type === "option" && def.options) {
    if (!def.options.includes(value)) {
      throw new Error(`參數 "${def.name}" 必須是 [${def.options.join(", ")}] 之一`);
    }
  }
  return value;
}

export function parseRecursive(
  tokens: string[],
  defs: ParamDef[],
  startIndex: number
): { data: Record<string, any>; nextIndex: number } {
  const result: Record<string, any> = {};
  const usedParams = new Set<string>();
  let i = startIndex;

  while (i < tokens.length) {
    const token = tokens[i];

    const matchByName = defs.find(d => d.name === token);

    if (matchByName) {
      usedParams.add(matchByName.name);

      if (matchByName.type === "group") {
        const childResult = parseRecursive(tokens, matchByName.children || [], i + 1);
        result[matchByName.name] = childResult.data;
        i = childResult.nextIndex;
      } else if (matchByName.type === "boolean") {
        const nextVal = tokens[i + 1];
        if (nextVal === "false" || nextVal === "true") {
          result[matchByName.name] = parseValue(nextVal, matchByName);
          i += 2;
        } else {
          result[matchByName.name] = true;
          i += 1;
        }
      } else {
        const valToken = tokens[i + 1];
        if (valToken === undefined && matchByName.required) {
          throw new Error(`參數 "${matchByName.name}" 缺少值`);
        }
        if (valToken) {
          result[matchByName.name] = parseValue(valToken, matchByName);
          i += 2;
        } else {
          i += 1;
        }
      }

    } else {
      const positionalMatch = defs.find(d =>
        !usedParams.has(d.name) &&
        d.type !== "group" &&
        d.type !== "boolean"
      );

      if (positionalMatch) {
        result[positionalMatch.name] = parseValue(token, positionalMatch);
        usedParams.add(positionalMatch.name);
        i += 1;
      } else {
        break;
      }
    }
  }

  return { data: result, nextIndex: i };
}

export function getCommandSignature(cmd: CommandType): string {
  if (!cmd.param || cmd.param.length === 0) return "";
  return cmd.param.map(p => p.required ? `[${p.name}]` : `<${p.name}>`).join(" ");
}

function semicolonIndexes(input: string): number[] {
  const result: number[] = [];
  let inQuote = false;
  let quoteChar = "";

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (char === '"' || char === "'") {
      if (!inQuote) {
        inQuote = true;
        quoteChar = char;
      } else if (char === quoteChar) {
        inQuote = false;
      }
    }

    if (char === ';' && !inQuote) result.push(i);
  }
  return result;
}

export function splitBySemicolon(input: string): string[] {
  const cuts = [-1, ...semicolonIndexes(input), input.length];
  const result: string[] = [];

  for (let i = 1; i < cuts.length; i++) {
    const segment = input.slice(cuts[i - 1] + 1, cuts[i]).trim();
    if (segment) result.push(segment);
  }
  return result;
}

export function getLastSemicolonIndex(input: string): number {
  return semicolonIndexes(input).at(-1) ?? -1;
}

export const findCommand = (list: CommandType[], name: string) =>
  list.find(c => c.name === name || c.alias?.includes(name))
