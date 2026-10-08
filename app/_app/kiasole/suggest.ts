import { CommandType, ParamDef, findCommand, getCommandSignature, getLastSemicolonIndex } from './parser'

export type SuggestionItem = {
  label: string;
  value: string;
  type?: string;
  desc?: string;
};

export type SuggestionResult = {
  activeCommand: CommandType | null
  suggestions: SuggestionItem[]
}

const none: SuggestionResult = { activeCommand: null, suggestions: [] }

export function getSuggestions(value: string, commandList: CommandType[]): SuggestionResult {
  if (!value.trim()) return none

  const lastSemiIndex = getLastSemicolonIndex(value);
  const currentSegment = value.slice(lastSemiIndex + 1);
  const trimmedSegment = currentSegment.trimStart();

  if (!trimmedSegment) return none

  const tokens = trimmedSegment.split(" ").filter(t => t !== "");
  const isInputtingLastToken = !currentSegment.endsWith(" ");
  const currentInput = isInputtingLastToken ? tokens[tokens.length - 1] : "";

  const matchedCmd = findCommand(commandList, tokens[0]);

  if (!matchedCmd) {
    if (tokens.length === 1 && isInputtingLastToken) {
      const suggestions = commandList
        .filter(c => !c.ignoreInHelp)
        .filter(c => c.name.startsWith(currentInput) || c.alias?.some(a => a.startsWith(currentInput)))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(c => ({
          label: c.name,
          value: c.name,
          type: "CMD",
          desc: getCommandSignature(c) || c.dsc
        }));

      return { activeCommand: null, suggestions }
    }

    return none
  }

  let currentDefs: ParamDef[] = matchedCmd.param || [];
  const usedParams = new Set<string>();

  let depth = 1;
  while (depth < (isInputtingLastToken ? tokens.length - 1 : tokens.length)) {
    const t = tokens[depth];
    const match = currentDefs.find(d => d.name === t);

    if (match) {
      usedParams.add(match.name);
      if (match.type === "group" && match.children) {
        currentDefs = match.children;
        usedParams.clear();
        depth++;
      } else if (match.type === "boolean") {
        const next = tokens[depth + 1];
        if (next === "true" || next === "false") depth += 2;
        else depth++;
      } else {
        depth += 2;
      }
    } else {
      const posMatch = currentDefs.find(d => !usedParams.has(d.name) && d.type !== "group" && d.type !== "boolean");
      if (posMatch) {
        usedParams.add(posMatch.name);
        depth++;
      } else {
        break;
      }
    }
  }

  const suggestions: SuggestionItem[] = [];

  const possibleParams = currentDefs.filter(d => !usedParams.has(d.name));

  const prevToken = tokens[isInputtingLastToken ? tokens.length - 2 : tokens.length - 1];
  const explicitPrevParam = currentDefs.find(d => d.name === prevToken);

  if (explicitPrevParam && explicitPrevParam.type !== "group" && explicitPrevParam.type !== "boolean") {
    if (explicitPrevParam.options) {
      suggestions.push(
        ...explicitPrevParam.options
          .filter(o => o.startsWith(currentInput))
          .map(o => ({ label: o, value: o, type: "VAL", desc: `Option` }))
      );
    }
  } else {
    suggestions.push(
      ...possibleParams
        .filter(d => d.name.startsWith(currentInput))
        .map(d => ({
          label: d.name,
          value: d.name,
          type: d.type === "group" ? "GRP" : "PRM",
          desc: d.dsc
        }))
    );

    const nextPositional = possibleParams.find(d => d.type !== "group" && d.type !== "boolean");
    if (nextPositional && nextPositional.options) {
      suggestions.push(
        ...nextPositional.options
          .filter(o => o.startsWith(currentInput))
          .map(o => ({ label: o, value: o, type: "VAL", desc: `Value for ${nextPositional.name}` }))
      );
    }
  }

  return { activeCommand: matchedCmd, suggestions }
}
