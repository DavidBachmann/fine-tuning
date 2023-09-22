#!/usr/bin/env node

import * as fs from 'fs/promises';
import yaml from 'js-yaml';
import yargs from 'yargs';
import type { Argv } from 'yargs';
import { hideBin } from 'yargs/helpers';

type YamlObject = Record<string, unknown>;

interface Data extends YamlObject {
  content?: string;
}

interface Options {
  paths: {
    system: string;
    completions: string;
    appendix?: string;
  };
  out: string;
}

const parseYaml = (text: string): YamlObject | null => {
  try {
    return yaml.load(text) as YamlObject;
  } catch {
    return null;
  }
};

const parse = (text: string): { data: Data[] } => {
  const dataArr: Data[] = [];
  const re =
    /-{3}(?:\n|\r)([\w\W]+?)(?:\n|\r)-{3}([\w\W]*?)(?=(?:\n|\r)-{3}|\s*$)/g;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    const data: Data = {};
    const [_, yamlOrJson, content] = match;

    data.content = content ?? '';

    const parsedData = parseYaml(yamlOrJson);

    if (parsedData) {
      Object.assign(data, parsedData);
    }

    dataArr.push(data);
  }

  return { data: dataArr };
};

type UserData = Record<string, unknown>;

function groupByTwo(arr: UserData[]): UserData[][] {
  const grouped: UserData[][] = [];

  for (let i = 0; i < arr.length; i += 2) {
    const pair: UserData[] = [];
    if (arr[i] !== undefined) {
      pair.push(arr[i]);
    }
    if (arr[i + 1] !== undefined) {
      pair.push(arr[i + 1]);
    }
    grouped.push(pair);
  }

  return grouped;
}

async function readSystem(path: string): Promise<Data | null> {
  try {
    const data = await fs.readFile(path, 'utf8');
    const parsedData = parse(data);
    const completions = parsedData['data'];

    if (!Array.isArray(completions)) {
      return null;
    }

    return completions[0];
  } catch (err) {
    throw new Error(err.message);
  }
}

async function readAppendix(path: string): Promise<Data | null> {
  try {
    const data = await fs.readFile(path, 'utf8');
    const parsedData = parse(data);
    const appendix = parsedData['data'];

    if (!Array.isArray(appendix)) {
      return null;
    }

    return appendix[0];
  } catch (err) {
    throw new Error(err.message);
  }
}

const readCompletion = async (
  path: string,
  appendix: string
): Promise<Data[] | null> => {
  try {
    const data = await fs.readFile(path, 'utf8');
    const parsedData = parse(data)?.['data'];

    if (!Array.isArray(parsedData)) {
      return null;
    }

    const groups = groupByTwo(parsedData);
    const conversation: Data[] = [];

    groups.forEach(([usr, assistant]) => {
      const user = {
        ...usr,
        content: String(usr.content).concat(`\n${appendix}`),
      };

      conversation.push({
        user,
        assistant,
      });
    });

    return conversation;
  } catch (err) {
    throw new Error(err.message);
  }
};

const parseIntoJSONL = (data: UserData[]): string =>
  data.map((item) => JSON.stringify(item)).join('\n');

const clean = (prompt: string) => prompt.replace(/^\n+/, '');

async function parsePaths(options: Options): Promise<string> {
  let appendix = '';
  const systemPrompt = await readSystem(options.paths.system).then((prompt) =>
    clean(prompt.content)
  );

  if (typeof options.paths.appendix === 'string') {
    try {
      appendix = await readAppendix(options.paths.appendix).then((data) =>
        clean(data.content)
      );
    } catch (e) {
      throw new Error('Appendix data failed.');
    }
  }

  const completions = await readCompletion(options.paths.completions, appendix);

  if (!systemPrompt || !completions) {
    throw new Error('System or Completions data is missing.');
  }

  const shaped = completions.map((completion) => ({
    messages: [
      systemPrompt,
      ...Object.values(completion).map((comp: Data) => clean(comp.content)),
    ],
  }));

  const jsonl = parseIntoJSONL(shaped);
  return jsonl;
}

type ArgvOptions = {
  system: string;
  completions: string;
  out: string;
  appendix?: string;
};

yargs(hideBin(process.argv))
  .command(
    'create',
    'Create JSONL for fine-tuning OpenAI models',
    (yargs: Argv) => {
      return yargs
        .option('system', {
          alias: 's',
          describe: 'Path to system.md',
          type: 'string',
          demandOption: true,
        })
        .option('completions', {
          alias: 'c',
          describe: 'Path to completions.md',
          type: 'string',
          demandOption: true,
        })
        .option('appendix', {
          alias: 'a',
          describe: 'Path to optional appendix',
          type: 'string',
        })
        .option('out', {
          alias: 'o',
          describe: 'Path to output folder',
          type: 'string',
          demandOption: true,
        });
    },
    async (argv: ArgvOptions) => {
      const parsed = await parsePaths({
        paths: {
          system: argv.system,
          completions: argv.completions,
          appendix: argv.appendix,
        },
        out: argv.out,
      });

      await fs.writeFile(`${argv.out}/fine-tuning.jsonl`, parsed);
    }
  )
  .help().argv;
