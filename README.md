## Fine-tuning OpenAI models made easier
Since OpenAI don't have a UI for fine-tuning models, I made this simple CLI.
The program consumes Markdown [^1] files and generates fine-tunings in the JSONL format preferred by OpenAI.

[^1]: Not really Markdown. It's a Markdown/YAML hybrid I made up. Your IDE might freak out.


### Installation

I'll make it available via `npx` when I figure out how.


```sh
pnpm run build
node ./dist/fine-tuning/main.js create --help

```

```
Options:
      --version      Show version number            [boolean]
      --help         Show help                      [boolean]
  -s, --system       Path to system.md              [string] [required]
  -c, --completions  Path to completions.md         [string] [required]
  -a, --appendix     Path to optional appendix      [string]
  -o, --out          Path to output folder          [string] [required]
```

### Usage

Try it out on the example files


```sh
node ./dist/fine-tuning/main.js create --system ./dist/fine-tuning/example/system.md --completions ./dist/fine-tuning/example/completions.md --appendix ./dist/fine-tuning/example/user-appendix.md --out ./
```

The example files will output the following `./fine-tuning.jsonl`:

```jsonl
{"messages":[{"role":"system","content":"You are an expert at summarizing movie plots."},{"role":"user","content":"Summarize Shrek please.\n\nFormat your answer in JSON format, like so:\n\n```\n  \"title\": \"The movie title\",\n  \"releaseYear\": 1969,\n  \"summary\": \"Your summary\"\n```"},{"role":"assistant","content":"{\n  \"title\": \"Shrek\",\n  \"releaseYear\": 2001,\n  \"summary\": \"An ogre named Shrek embarks on a quest to rescue Princess Fiona so he can regain his swamp, which has been overrun by fairy-tale creatures banished by Lord Farquaad. Shrek and his companion, Donkey, rescue Fiona, who hides a secret: she turns into an ogre at night. Eventually, Shrek and Fiona fall in love, revealing that true beauty is found within, and they live \"happily ever after.\"\n}\n\n"}]}
{"messages":[{"role":"system","content":"You are an expert at summarizing movie plots."},{"role":"user","content":"Write me a short summary of the first Die Hard movie.\n\nFormat your answer in JSON format, like so:\n\n```\n  \"title\": \"The movie title\",\n  \"releaseYear\": 1969,\n  \"summary\": \"Your summary\"\n```"},{"role":"assistant","content":"{\n  \"title\": \"Die Hard\",\n  \"releaseYear\": 1998,\n  \"summary\": \"New York City police officer John McClane visits his estranged wife Holly in Los Angeles for Christmas. He arrives at Nakatomi Plaza, where Holly works, just as terrorists led by Hans Gruber take hostages, including Holly, to rob the building's vault. Trapped inside, McClane fights the terrorists one by one to save the hostages. In the end, he foils Gruber's plan and reunites with his wife.\"\n}\n\n"}]}
{"messages":[{"role":"system","content":"You are an expert at summarizing movie plots."},{"role":"user","content":"Give me a summary for the 2007 cult classic, Bee Movie!\n\nFormat your answer in JSON format, like so:\n\n```\n  \"title\": \"The movie title\",\n  \"releaseYear\": 1969,\n  \"summary\": \"Your summary\"\n```"},{"role":"assistant","content":"{\n  \"title\": \"Bee Movie\",\n  \"releaseYear\": 2007,\n  \"summary\": \"A bee named Barry B. Benson sues the human race for stealing honey after discovering that humans harvest it en masse. The lawsuit is successful but leads to ecological imbalance. Barry then works to restore nature's balance and finds a new appreciation for bees' role in the ecosystem\"\n}"}]}
```

