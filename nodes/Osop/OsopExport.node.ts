import { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';
import * as yaml from 'js-yaml';

const N8N_TYPE_MAP: Record<string, string> = {
	api: 'n8n-nodes-base.httpRequest',
	cli: 'n8n-nodes-base.executeCommand',
	agent: 'n8n-nodes-base.code',
	human: 'n8n-nodes-base.manualTrigger',
	db: 'n8n-nodes-base.postgres',
	system: 'n8n-nodes-base.set',
	data: 'n8n-nodes-base.set',
	git: 'n8n-nodes-base.git',
	docker: 'n8n-nodes-base.executeCommand',
	cicd: 'n8n-nodes-base.executeCommand',
	infra: 'n8n-nodes-base.httpRequest',
	mcp: 'n8n-nodes-base.httpRequest',
};

export class OsopExport implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'OSOP Export',
		name: 'osopExport',
		group: ['transform'],
		version: 1,
		subtitle: 'Convert OSOP to n8n workflow',
		description: 'Convert an OSOP YAML workflow into n8n-compatible workflow JSON.',
		defaults: { name: 'OSOP Export' },
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				displayName: 'OSOP YAML',
				name: 'osopYaml',
				type: 'string',
				typeOptions: { rows: 10 },
				default: '',
				description: 'Paste OSOP YAML content here.',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const results: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			const osopYaml = this.getNodeParameter('osopYaml', i) as string || (items[i].json as any).osop_yaml || '';
			const data = yaml.load(osopYaml) as any;

			const nodes = (data.nodes || []).map((n: any, idx: number) => ({
				name: n.name || n.id,
				type: N8N_TYPE_MAP[n.type] || 'n8n-nodes-base.noOp',
				position: [250 + idx * 200, 300],
				parameters: {},
				typeVersion: 1,
			}));

			const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
			const nameMap: Record<string, string> = {};
			for (const n of data.nodes || []) {
				nameMap[slugify(n.id)] = n.name || n.id;
			}

			const connections: Record<string, any> = {};
			for (const e of data.edges || []) {
				const fromName = nameMap[e.from] || e.from;
				const toName = nameMap[e.to] || e.to;
				if (!connections[fromName]) connections[fromName] = { main: [[]] };
				connections[fromName].main[0].push({ node: toName, type: 'main', index: 0 });
			}

			const n8nWorkflow = {
				name: data.name || 'OSOP Workflow',
				nodes,
				connections,
			};

			results.push({ json: { n8n_workflow: n8nWorkflow, n8n_json: JSON.stringify(n8nWorkflow, null, 2) } });
		}

		return [results];
	}
}
