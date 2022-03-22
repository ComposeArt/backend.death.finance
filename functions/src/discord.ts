import _ from 'lodash';
import fetch from 'node-fetch';
import nodeHtmlToImage from 'node-html-to-image';
import * as functions from 'firebase-functions';
import { InteractionResponseType, InteractionType, verifyKey } from 'discord-interactions';

import { convertPerms } from './discord-permissions';

export const updateMessage = async (message: any) => {
  await fetch(`https://discord.com/api/webhooks/${message.application_id}/${message.token}`, {
    method: 'POST',
    body: JSON.stringify({
      content: message.content
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  });
};

export const handle = async (admin: any, request: any, response: any) => {
  const db = admin.firestore();

  if (request.method === 'POST') {
    const signature = request.headers['x-signature-ed25519'];
    const timestamp = request.headers['x-signature-timestamp'];
    const isValidRequest = verifyKey(
      request.rawBody,
      signature,
      timestamp,
      functions.config().discord.public,
    );

    if (!isValidRequest) {
      return response.status(401).send({ error: 'Bad request signature' });
    }

    const message = request.body;

    console.log(JSON.stringify(message));

    if (message.type === InteractionType.PING) {
      response.send({
        type: InteractionResponseType.PONG,
      });
    } else if (message.type === InteractionType.APPLICATION_COMMAND) {

      const permissions = convertPerms(parseInt(message.member.permissions, 10));

      console.log(JSON.stringify(permissions));

      const action = message.data.name;

      if (action === 'slap') {
        response.status(200).send({
          type: 4,
          data: {
            content: `*<@${message.member.user.id}> slaps <@${message.data.options[0].value}> around a bit with a large trout*`,
          },
        });
      } else if (action === 'collections') {
        const collectionDocs = await db.collection('collections').get();
        const collections = collectionDocs.docs.map((f: any) => f.id);

        response.status(200).send({
          type: 4,
          data: {
            content: `${JSON.stringify(collections)}`,
          },
        });
      } else if (action === 'refresh') {
        const collectionId = message.data.options[0].value;

        await db.collection('commands').doc().set({
          token: message.token,
          application_id: message.application_id,
          guild_id: message.guild_id,
          type: 'refresh',
          collection: collectionId,
        });

        response.status(200).send({
          type: 4,
          data: {
            content: `refreshing metadata for ${collectionId}...`,
          },
        });
      } else if (action === 'fight') {
        const collection1 = message.data.options[0].value;
        const token1 = message.data.options[1].value;
        const collection2 = message.data.options[2].value;
        const token2 = message.data.options[3].value;

        await db.collection('commands').doc().set({
          token: message.token,
          application_id: message.application_id,
          guild_id: message.guild_id,
          type: 'fight',
          collection1,
          token1,
          collection2,
          token2,
        });

        response.status(200).send({
          type: 4,
          data: {
            content: `3, 2, 1 Let's dance...`,
          },
        });
      } else {
        console.error('Unknown Command');
        response.status(400).send({ error: 'Unknown Type' });
      }
    } else if (message.type === InteractionType.APPLICATION_COMMAND_AUTOCOMPLETE) {
      const action = message.data.name;

      if (action === 'refresh') {
        response.status(200).send({
          type: 8,
          data: {
            choices: [{
              value: 'monster-satoshibles',
              name: 'monster-satoshibles',
            }],
          },
        });
      } else if (action === 'fight') {
        if (message.data.options[0].focused) {
          response.status(200).send({
            type: 8,
            data: {
              choices: [{
                value: 'monster-satoshibles',
                name: 'monster-satoshibles',
              }],
            },
          });
        } else if (message.data.options[2].focused) {
          response.status(200).send({
            type: 8,
            data: {
              choices: [{
                value: 'monster-satoshibles',
                name: 'monster-satoshibles',
              }],
            },
          });
        }
      }
    } else {
      console.error('Unknown Type');
      response.status(400).send({ error: 'Unknown Type' });
    }
  } else {
    response.status(500);
  }
};
