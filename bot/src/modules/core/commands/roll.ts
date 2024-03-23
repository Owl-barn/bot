import { embedTemplate, failEmbedTemplate } from "@lib/embedTemplate";
import { CommandGroup } from "@structs/command";
import { Command } from "@structs/command/command";
import { APIEmbedField, ApplicationCommandOptionType } from "discord.js";


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
        max: 100,
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
      type Token =
        | { type: "Paren"; contents: Token[] }
        | { type: "Number"; value: number }
        | { type: "Dice"; amount: number; sides: number }
        | { type: "Add"; }
        | { type: "Sub"; }
        | { type: "Mul"; }
        | { type: "Div"; };

      function tokenize(s: string): Token[] {
        s = s.replaceAll(" ", "");
        let result: Token[] = [];
        while (s.length) {
          if (s[0] == "(") {
            let depth = 1;
            let index = 0;

            while (depth) {
              index++;
              if (index == s.length) {
                throw { userError: "Unmatched parenthesis" };
              }
              if (s[index] == "(") { depth++; };
              if (s[index] == ")") { depth--; };
            }

            result.push({
              type: "Paren",
              contents: tokenize(s.substring(1, index))
            })

            s = s.substring(index + 1);
            continue;

          } else if (s[0] == "d" || !isNaN(s[0] as unknown as number)) {
            let match = s.match(/^(\d+)?d(\d+)/);
            if (match) {
              const amount = match[1] ? parseInt(match[1]) : 1;
              const sides = parseInt(match[2]);
              if (amount < 1 || amount > 100) {
                throw { userError: "Invalid amount of dice" };
              }
              if (sides < 2 || sides > 10000) {
                throw { userError: "Invalid amount of sides" };
              }
              result.push({
                type: "Dice",
                amount: amount,
                sides: sides
              })
              s = s.substring(match[0].length);
              continue;
            } else {
              match = s.match(/^\d+/);
              if (match) {
                result.push({
                  type: "Number",
                  value: parseInt(match[0])
                })
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

      type AST =
        | { type: "Number"; value: number }
        | { type: "Dice"; amount: number; sides: number }
        | { type: "RolledDice"; values: number[], sides: number }
        | { type: "Add"; left: AST; right: AST }
        | { type: "Sub"; left: AST; right: AST }
        | { type: "Mul"; left: AST; right: AST }
        | { type: "Div"; left: AST; right: AST }
        | { type: "Neg"; right: AST };

      function make_ast(tokens: Token[]): AST {
        for (let operation of ["Add", "Sub", "Mul", "Div"]) {
          let idx = tokens.findLastIndex((t) => t.type == operation)
          if (idx > 0) {
            return {
              type: operation as any,
              left: make_ast(tokens.slice(0, idx)),
              right: make_ast(tokens.slice(idx + 1))
            }
          }
        }

        if (tokens[0].type == "Sub") {
          return {
            type: "Neg",
            right: make_ast(tokens.slice(1))
          }
        }

        if (tokens.length != 1) {
          // two expresssions must be joined by binary operator
          throw { userError: "Two expresssions must be joined by binary operator" };
        }

        if (tokens[0].type == "Paren") {
          return make_ast(tokens[0].contents);
        }

        if (tokens[0].type == "Number" || tokens[0].type == "Dice") {
          return tokens[0];
        }

        //invalid token
        throw new Error("Invalid token");
      }

      // roll all the dice in the AST, relacing "Dice" nodes with "RolledDice" nodes
      function roll(ast: AST): AST {
        if (ast.type == "Add" || ast.type == "Sub" || ast.type == "Mul" || ast.type == "Div") {
          return {
            type: ast.type,
            left: roll(ast.left),
            right: roll(ast.right)
          };
        } else if (ast.type == "Neg") {
          return {
            type: "Neg",
            right: roll(ast.right)
          };
        } if (ast.type == "Dice") {
          return {
            type: "RolledDice",
            sides: ast.sides,
            values: Array.from({ length: ast.amount }, () => Math.floor(Math.random() * ast.sides) + 1)
          }
        } else if (ast.type == "Number") {
          return { ...ast };
        }
        throw new Error("Invalid AST");
      }

      // add parentheses to the AST at the current level if needed
      function needs_parens(ast: AST): string {
        if (ast.type == "Add" || ast.type == "Sub" || ast.type == "Neg") {
          return "(" + render(ast) + ")";
        }
        return render(ast);
      }

      function render(ast: AST): string {
        if (ast.type == "Number") {
          return ast.value.toString();
        } else if (ast.type == "Dice") {
          return ast.amount.toString() + "d" + ast.sides.toString();
        } else if (ast.type == "RolledDice") {
          // left pad the numbers to the same length
          return "[" + ast.values.map((v) => v.toString().padStart(ast.sides.toString().length, " ")).join(", ") + "]";
        } else if (ast.type == "Add") {
          return render(ast.left) + " + " + render(ast.right);
        } else if (ast.type == "Sub") {
          return render(ast.left) + " - " + render(ast.right);
        } else if (ast.type == "Mul") {
          return needs_parens(ast.left) + "*" + needs_parens(ast.right);
        } else if (ast.type == "Div") {
          return needs_parens(ast.left) + "/" + needs_parens(ast.right);
        } else if (ast.type == "Neg") {
          return "-" + render(ast.right);
        }

        throw new Error("Invalid AST")
      }

      // compute the total of the AST
      function total(ast: AST): number {
        if (ast.type == "Number") {
          return ast.value;
        } else if (ast.type == "RolledDice") {
          return ast.values.reduce((acc, cur) => acc + cur, 0);
        } else if (ast.type == "Add") {
          return total(ast.left) + total(ast.right);
        } else if (ast.type == "Sub") {
          return total(ast.left) - total(ast.right);
        } else if (ast.type == "Mul") {
          return total(ast.left) * total(ast.right);
        } else if (ast.type == "Div") {
          return total(ast.left) / total(ast.right);
        } else if (ast.type == "Neg") {
          return -total(ast.right);
        }

        throw new Error("Invalid AST")
      }

      const notation = msg.options.getString("sides", true);
      const amount = msg.options.getInteger("amount", false) ?? 1;

      // check, if notation is a simple number. parseInt doesn't work for dnd notation, because "1d6" would be parsed as "1"
      if (notation.match(/^\d+$/)) {
        const sides = parseInt(notation);
        if (sides < 2 || sides > 100) {
          return { content: "Invalid amount of sides" };
        }

        if (amount === 1) {
          const roll = Math.floor(Math.random() * sides) + 1;

          const descriptionParts = [`rolled a ${roll}`];

          // coin flip if it's a two-sided die
          if (sides === 2)
            descriptionParts.push(roll === 1 ? "Heads" : "Tails");

          const embed = embedTemplate()
            .setTitle(`D${sides} dice roll`)
            .setDescription(descriptionParts.join(" | "));

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
      if (amount < 1 || amount > 24) {
        return { content: "Invalid amount of re-rolls" };
      }

      const tokens = tokenize(notation);
      const ast = make_ast(tokens);
      const fields: APIEmbedField[] = [];
      for (let i = 0; i < amount; i++) {
        const rolled = roll(ast);
        fields.push(
          {
            name: "Results",
            value: `\`${render(rolled)} = ${total(rolled).toString()}\``,
          });
      }

      const embed = embedTemplate()
        .setTitle(`Dice roll`)
        .setDescription(`rolled ${render(ast)}`)
        .addFields(fields)

      return { embeds: [embed] };

    } catch (e) {
      if ("userError" in (e as any)) {
        return { embeds: [failEmbedTemplate((e as any).userError)] };
      } else {
        console.log(e);
        return { embeds: [failEmbedTemplate("An error occurred while rolling the dice")] };
      }
    }
  }
);
