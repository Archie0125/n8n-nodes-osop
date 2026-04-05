# n8n-nodes-osop

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![npm](https://img.shields.io/npm/v/n8n-nodes-osop)](https://www.npmjs.com/package/n8n-nodes-osop)

[n8n](https://n8n.io) community nodes for [OSOP](https://osop.ai) (Open Standard Operating Procedures). Import, export, and validate `.osop.yaml` workflows inside n8n.

## Nodes

| Node | Description |
|------|-------------|
| **OSOP Import** | Convert n8n workflow JSON → portable OSOP YAML |
| **OSOP Export** | Convert OSOP YAML → n8n workflow JSON |
| **OSOP Validate** | Validate OSOP YAML against the spec |

## Installation

### Community Nodes (recommended)

1. Go to **Settings > Community Nodes** in your n8n instance
2. Enter `n8n-nodes-osop`
3. Click Install

### Manual

```bash
cd ~/.n8n/nodes
npm install n8n-nodes-osop
```

## Usage

### Import: n8n → OSOP

Drop the **OSOP Import** node into your workflow. It converts your n8n workflow JSON into portable OSOP YAML that works across any OSOP-compatible tool.

### Export: OSOP → n8n

Paste OSOP YAML into the **OSOP Export** node to generate n8n-compatible workflow JSON that you can import directly.

### Validate

The **OSOP Validate** node checks your OSOP YAML for:
- Required fields (osop_version, id, nodes, edges)
- Valid node types (12 types: human, agent, api, cli, etc.)
- Valid edge modes (10 modes: sequential, conditional, parallel, etc.)
- Dangling edge references

## What is OSOP?

OSOP is the OpenAPI of workflows — a YAML standard for defining AI agent and automation workflows. Same workflow runs in n8n, Airflow, Argo, CrewAI, and more.

## Links

- [OSOP Website](https://osop.ai)
- [OSOP Spec](https://github.com/Archie0125/osop-spec)
- [OSOP MCP Server](https://github.com/Archie0125/osop-mcp) — 5 MCP tools (validate, render, report, diff, risk_assess)
- [Visual Editor](https://osop-editor.vercel.app)

## License

Apache License 2.0
