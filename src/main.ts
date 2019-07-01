#!/usr/bin/env node

import { WebClient } from "@slack/client";
import inquirer from "inquirer";

interface SlackChannel {
  id: string;
  name: string;
  is_member: boolean;
}

const client = new WebClient(process.env["SLACK_TOKEN"]!);

const pattern = new RegExp(process.argv[2] || /(?:)/);

(async () => {
  const result = await client.channels.list();
  if (!result.ok) {
    console.error(result.error);
    return;
  }

  const channels = result.channels as SlackChannel[];
  const channelByName: { [name: string]: SlackChannel } = {};
  for (const ch of channels) {
    channelByName[ch.name] = ch;
  }

  const chosen = (await inquirer.prompt({
    name: "channels",
    choices: channels.filter(ch => ch.is_member && pattern.test(ch.name)).map(({ name }) => name),
    type: "checkbox"
  })) as { channels: string[] };

  for (const chName of chosen.channels) {
    const ch = channelByName[chName];
    if (!ch) {
      console.warn(`Channel not found: #${chName}`);
      continue;
    }

    const result = await client.channels.leave({ channel: ch.id });
    if (!result.ok) {
      console.warn(`Failed to leave channel #${chName}: ${result.error || "(unknown)"}`);
    }
  }
})();
