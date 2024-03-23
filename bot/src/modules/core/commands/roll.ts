import { embedTemplate, failEmbedTemplate } from "@lib/embedTemplate";
import { CommandGroup } from "@structs/command";
import { Command } from "@structs/command/command";
import { APIEmbedField, ApplicationCommandOptionType } from "discord.js";

const maxRolls = 100;
const maxSides = 10000;
const maxRerolls = 24;

export default Command(

  // Info
  {
    name: "roll",
    description: "Roll the dice",
    group: CommandGroup.general,

    isGlobal: true,

    arguments: [
      {
        type: ApplicationCommandOptionType.String,
        name: "sides",
        description: "How many sides does the dice have? (can be given in dnd notation)",
        required: true,
      },
      {
        type: ApplicationCommandOptionType.Integer,
        name: "amount",
        description: "How many dice to roll?",
        required: false,
        min: 1,
        max: maxRolls,
      },
    ],

    throttling: {
      duration: 10,
      usages: 3,
    },
  },

  // Execute
  async (msg) => {
    try {
      const notation = msg.options.getString("sides", true);
      const amount = msg.options.getInteger("amount", false) ?? 1;

      // check, if notation is a simple number. parseInt doesn't work for dnd notation, because "1d6" would be parsed as "1"
      if (notation.match(/^\d+$/)) {
        const sides = parseInt(notation);
        if (sides < 2 || sides > 100) {
          return { content: "Invalid amount of sides" };
        }

        // Only one die role
        if (amount === 1) {
          const roll = Math.floor(Math.random() * sides) + 1;

          let description = `rolled a ${roll}`;

          // coin flip if it's a two-sided die
          if (sides === 2)
            description += ` | (${roll === 1 ? "Heads" : "Tails"})`;

          const embed = embedTemplate()
            .setTitle(`D${sides} dice roll`)
            .setDescription(description);

          return { embeds: [embed] };
        }

        const rolls: number[] = [];
        for (let i = 0; i < amount; i++)
          rolls.push(Math.floor(Math.random() * parseInt(notation)) + 1);

        const total = rolls.reduce((acc, cur) => acc + cur, 0);

        const fields: APIEmbedField[] = [
          {
            name: "Results",
            value: `\`${rolls.join(", ")}\``,
          },
          {
            name: "Total",
            value: total.toString(),
          },
        ];

        const embed = embedTemplate()
          .setTitle(`Dice roll`)
          .setDescription(`rolled ${amount}d${notation}`)
          .addFields(fields);
        return { embeds: [embed] };
      }

      // check that amount is in the correct range
      if (amount < 1 || amount > maxRerolls) {
        return { content: "Invalid amount of re-rolls" };
      }

      const tokens = generateTokens(notation);
      const ast = generateAST(tokens);
      const fields: APIEmbedField[] = [];
      for (let i = 0; i < amount; i++) {
        const rolled = rollDice(ast);
        fields.push(
          {
            name: "Results",
            value: `\`${renderAST(rolled)} = ${computeTotal(rolled).toString()}\``,
          });
      }

      const embed = embedTemplate()
        .setTitle(`Dice roll`)
        .setDescription(`rolled ${renderAST(ast)}`)
        .addFields(fields);

      return { embeds: [embed] };

    } catch (e) {
      if (e && typeof e === "object" && "userError" in e) {
        return { embeds: [failEmbedTemplate(e.userError as string)] };
      } else {
        console.log(e);
        return { embeds: [failEmbedTemplate("An error occurred while rolling the dice")] };
      }
    }
  }
);

type Token =
  | { type: "Paren"; contents: Token[] }
  | { type: "Number"; value: number }
  | { type: "Dice"; amount: number; sides: number }
  | { type: "Add"; }
  | { type: "Sub"; }
  | { type: "Mul"; }
  | { type: "Div"; };

type AST =
  | { type: "Number"; value: number }
  | { type: "Dice"; amount: number; sides: number }
  | { type: "RolledDice"; values: number[], sides: number }
  | { type: "Add"; left: AST; right: AST }
  | { type: "Sub"; left: AST; right: AST }
  | { type: "Mul"; left: AST; right: AST }
  | { type: "Div"; left: AST; right: AST }
  | { type: "Neg"; right: AST };


function generateTokens(s: string): Token[] {
  s = s.replaceAll(" ", "");
  const result: Token[] = [];
  while (s.length) {
    if (s[0] == "(") {
      let depth = 1;
      let index = 0;

      while (depth) {
        index++;
        if (index == s.length) {
          throw { userError: "Unmatched parenthesis" };
        }
        if (s[index] == "(") { depth++; }
        if (s[index] == ")") { depth--; }
      }

      result.push({
        type: "Paren",
        contents: generateTokens(s.substring(1, index)),
      });

      s = s.substring(index + 1);
      continue;

    } else if (s[0] == "d" || !isNaN(s[0] as unknown as number)) {
      let match = s.match(/^(\d+)?d(\d+)/);
      if (match) {
        const amount = match[1] ? parseInt(match[1]) : 1;
        const sides = parseInt(match[2]);
        if (amount < 1 || amount > maxRolls) {
          throw { userError: "Invalid amount of dice" };
        }
        if (sides < 2 || sides > maxSides) {
          throw { userError: "Invalid amount of sides" };
        }
        result.push({
          type: "Dice",
          amount: amount,
          sides: sides,
        });
        s = s.substring(match[0].length);
        continue;
      } else {
        match = s.match(/^\d+/);
        if (match) {
          result.push({
            type: "Number",
            value: parseInt(match[0]),
          });
          s = s.substring(match[0].length);
          continue;
        }
      }
    } else if (s[0] == "+") {
      result.push({ type: "Add" });
      s = s.substring(1);
      continue;
    } else if (s[0] == "-") {
      result.push({ type: "Sub" });
      s = s.substring(1);
      continue;
    } else if (s[0] == "*") {
      result.push({ type: "Mul" });
      s = s.substring(1);
      continue;
    } else if (s[0] == "/") {
      result.push({ type: "Div" });
      s = s.substring(1);
      continue;
    } else if (s[0] == ")") {
      throw { userError: "Unmatched parenthesis" };
    }
    throw { userError: `Invalid token: ${s[0]}` };
  }
  return result;
}

function generateAST(tokens: Token[]): AST {
  for (const operation of ["Add", "Sub", "Mul", "Div"]) {
    const idx = tokens.findLastIndex((t) => t.type == operation);
    if (idx > 0) {
      return {
        type: operation as "Add" | "Sub" | "Mul" | "Div",
        left: generateAST(tokens.slice(0, idx)),
        right: generateAST(tokens.slice(idx + 1)),
      };
    }
  }

  if (tokens[0].type == "Sub") {
    return {
      type: "Neg",
      right: generateAST(tokens.slice(1)),
    };
  }

  if (tokens.length != 1) {
    // two expresssions must be joined by binary operator
    throw { userError: "Two expresssions must be joined by binary operator" };
  }

  if (tokens[0].type == "Paren") {
    return generateAST(tokens[0].contents);
  }

  if (tokens[0].type == "Number" || tokens[0].type == "Dice") {
    return tokens[0];
  }

  // invalid token
  throw new Error("Invalid token");
}

// roll all the dice in the AST, relacing "Dice" nodes with "RolledDice" nodes
function rollDice(ast: AST): AST {
  if (ast.type == "Add" || ast.type == "Sub" || ast.type == "Mul" || ast.type == "Div") {
    return {
      type: ast.type,
      left: rollDice(ast.left),
      right: rollDice(ast.right),
    };
  } else if (ast.type == "Neg") {
    return {
      type: "Neg",
      right: rollDice(ast.right),
    };
  } if (ast.type == "Dice") {
    return {
      type: "RolledDice",
      sides: ast.sides,
      values: Array.from({ length: ast.amount }, () => Math.floor(Math.random() * ast.sides) + 1),
    };
  } else if (ast.type == "Number") {
    return { ...ast };
  }
  throw new Error("Invalid AST");
}

// add parentheses to the AST at the current level if needed
function addNecessaryParentheses(ast: AST): string {
  if (ast.type == "Add" || ast.type == "Sub" || ast.type == "Neg") {
    return "(" + renderAST(ast) + ")";
  }
  return renderAST(ast);
}

function renderAST(ast: AST): string {
  if (ast.type == "Number") {
    return ast.value.toString();
  } else if (ast.type == "Dice") {
    return ast.amount.toString() + "d" + ast.sides.toString();
  } else if (ast.type == "RolledDice") {
    // left pad the numbers to the same length
    return "[" + ast.values.map((v) => v.toString().padStart(ast.sides.toString().length, " ")).join(", ") + "]";
  } else if (ast.type == "Add") {
    return renderAST(ast.left) + " + " + renderAST(ast.right);
  } else if (ast.type == "Sub") {
    return renderAST(ast.left) + " - " + renderAST(ast.right);
  } else if (ast.type == "Mul") {
    return addNecessaryParentheses(ast.left) + "*" + addNecessaryParentheses(ast.right);
  } else if (ast.type == "Div") {
    return addNecessaryParentheses(ast.left) + "/" + addNecessaryParentheses(ast.right);
  } else if (ast.type == "Neg") {
    return "-" + renderAST(ast.right);
  }

  throw new Error("Invalid AST");
}

// compute the total of the AST
function computeTotal(ast: AST): number {
  if (ast.type == "Number") {
    return ast.value;
  } else if (ast.type == "RolledDice") {
    return ast.values.reduce((acc, cur) => acc + cur, 0);
  } else if (ast.type == "Add") {
    return computeTotal(ast.left) + computeTotal(ast.right);
  } else if (ast.type == "Sub") {
    return computeTotal(ast.left) - computeTotal(ast.right);
  } else if (ast.type == "Mul") {
    return computeTotal(ast.left) * computeTotal(ast.right);
  } else if (ast.type == "Div") {
    return computeTotal(ast.left) / computeTotal(ast.right);
  } else if (ast.type == "Neg") {
    return -computeTotal(ast.right);
  }

  throw new Error("Invalid AST");
}
