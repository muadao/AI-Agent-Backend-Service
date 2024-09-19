<!--
title: 'Voice AI Agent Backend'
description: 'This is a minimal example of an AI agent backend service with voice inputs and outputs.'
layout: Doc
framework: v3
language: nodeJS
priority: 1
authorLink: 'https://github.com/muadao'
authorName: 'MUA DAO'
authorAvatar: 'https://avatars.githubusercontent.com/u/97941133?s=200&v=4'
-->

# Voice AI Agent Backend

This is a minimal example of an AI agent backend service which provides ASR, LLM, and TTS services. The backend service
is designed to be used with the GaiaNet platform, but can also be used with other compatible LLM services.

## Features

## Configuration

### Environment Variables

Several environment variables are required to be set in the `.env` file. The following is an example of the required
environment variables:

```bash
OPENAI_API_KEY=sk-...

PLAYHT_API_KEY=...
PLAYHT_USER_ID=...

PORT=4242
```

### Agent Configs

```json

```

## Compatibility

The default backend service is designed to be used with the GaiaNet platform.
However, as GaiaNet applies to the OpenAI API, it's actually independent of GaiaNet and can be used with other
compatible LLM services.

To use the backend service with another LLM service, simply fill in ```llm_server``` in AI Agent Configs
in ```./configs/aia_config.json``` with a compatible LLM service URL.