import { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';
import * as yaml from 'js-yaml';

const NODE_TYPE_MAP: Record<string, string> = {
	'n8n-nodes-base.httpRequest': 'api',
	'n8n-nodes-base.code': 'cli',
	'n8n-nodes-base.executeCommand': 'cli',
	'n8n-nodes-base.if': 'system',
	'n8n-nodes-base.switch': 'system',
	'n8n-nodes-base.merge': 'data',
	'n8n-nodes-base.set': 'data',
	'n8n-nodes-base.manualTrigger': 'human',
	'n8n-nodes-base.webhook': 'api',
	'n8n-nodes-base.scheduleTrigger': 'system',
	'n8n-nodes-base.postgres': 'db',
	'n8n-nodes-base.mysql': 'db',
	'n8n-nodes-base.redis': 'db',
	'n8n-nodes-base.slack': 'api',
	'n8n-nodes-base.emailSend': 'api',
	'n8n-nodes-base.git': 'git',
};

export class OsopImport implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'OSOP Import',
		name: 'osopImport',
		group: ['transform'],
		version: 1,
		subtitle: 'Convert n8n workflow to OSOP',
		description: 'Convert the current n8n workflow JSON into portable OSOP YAML format.',
		defaults: { name: 'OSOP Import' },
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				displayName: 'Workflow JSON',
				name: 'workflowJson',
				type: 'string',
				typeOptions: { rows: 10 },
				default: '',
				description: 'Paste n8n workflow JSON here, or connect from a previous node.',
			},
			{
				displayName: 'Workflow Name',
				name: 'workflowName',
				type: 'string',
				default: 'My Workflow',
				description: 'Name for the generated OSOP workflow.',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const results: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			const workflowJson = this.getNodeParameter('workflowJson', i) as string || JSON.stringify(items[i].json);
			const workflowName = this.getNodeParameter('workflowName', i) as string;

			const data = JSON.parse(workflowJson);
			const n8nNodes = data.nodes || [];
			const connections = data.connections || {};

			const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

			const nodes = n8nNodes.map((n: any) => ({
				id: slugify(n.name),
				type: NODE_TYPE_MAP[n.type] || 'system',
				name: n.name,
				description: `n8n: ${n.type}`,
			}));

			const edges: any[] = [];
			for (const [fromName, connData] of Object.entries(connections) as any) {
				const mainConns = connData.main || [];
				for (const group of mainConns) {
					if (Array.isArray(group)) {
						for (const conn of group) {
							edges.push({
								from: slugify(fromName),
								to: slugify(conn.node),
								mode: 'sequential',
							});
						}
					}
				}
			}

			const osopWorkflow = {
				osop_version: '1.0',
				id: slugify(workflowName),
				name: workflowName,
				description: `Imported from n8n — ${nodes.length} nodes.`,
				nodes,
				edges,
			};

			results.push({ json: { osop_yaml: yaml.dump(osopWorkflow), workflow: osopWorkflow } });
		}

		return [results];
	}
}
