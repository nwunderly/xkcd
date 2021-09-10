import { verify } from './verify'

import {
  InteractionType,
  InteractionResponseType,
  APIInteractionResponse as InteractionResponse,
  APIApplicationCommandInteraction as Interaction,
  APIApplicationCommandInteractionData as InteractionData
} from 'discord-api-types/v9'

import { APIPingInteraction } from 'discord-api-types/payloads/v9/_interactions/ping'


/***********\
* Commands *
\***********/

const commands = {
  'test': test,
  'invite': invite,
  'xkcd': xkcd,
}

async function test(_) {
  return respondEphemeral('Hello from Cloudflare workers and TypeScript!')
}

async function invite(_) {
  return respondEphemeral(
      '[Invite me to your server!](https://discord.com/api/oauth2/authorize' +
      '?client_id=884864200374124624&scope=applications.commands)'
  )
}

async function xkcd(command) {
  let comic = ''
  if ('options' in command) {
    comic = String(command.options[0].value) + '/'
  }
  return respond('https://xkcd.com/' + comic)
}


/*****************\
* The Actual Bot *
\*****************/

export async function handleRequest(request: Request): Promise<Response> {
  if (!request.headers.get('X-Signature-Ed25519') || !request.headers.get('X-Signature-Timestamp'))
    return Response.redirect('https://nwunder.com')
  if (!await verify(request)) return new Response('', {status: 401})

  const interaction = await request.json() as APIPingInteraction | Interaction

  if (interaction.type === InteractionType.Ping) {
    return respondComplex({
      type: InteractionResponseType.Pong
    })
  } else if (interaction.type === InteractionType.ApplicationCommand) {
    return respondToCommand(interaction.data)
  } else {
    return respondEphemeral("Error: Unsupported interaction type.")
  }
}

async function respondToCommand(command: InteractionData) {
  if (command.name in commands) {
    return commands[command.name](command)
  } else {
    return respondEphemeral('Command not found: ' + command.name)
  }
}


/****************\
* Utility Stuff *
\****************/

export async function respond(content: string): Promise<Response> {
  return respondComplex({
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content: content,
    }
  })
}

export async function respondEphemeral(content: string): Promise<Response> {
  return respondComplex({
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content: content,
      flags: 1<<6,
    }
  })
}

async function respondComplex(response: InteractionResponse): Promise<Response> {
  return new Response(JSON.stringify(response), {headers: {'content-type': 'application/json'}})
}
