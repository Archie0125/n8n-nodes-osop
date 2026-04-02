import { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';
import * as yaml from 'js-yaml';

const VALID_TYPES = new Set(['human', 'agent', 'api', 'cli', 'db', 'git', 'docker', 'cicd', 'mcp', 'system', 'infra', 'data']);
const VALID_MODES = new Set(['sequential', 'conditional', 'parallel', 'loop', 'event', 'fallback', 'error', 'timeout', 'spawn', 'switch']);

export class OsopValidate implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'OSOP Validate',
		name: 'osopValidate',
		group: ['transform'],
		version: 1,
		subtitle: 'Validate OSOP workflow',
		description: 'Validate an OSOP YAML workflow against the spec — checks required fields, node types, edge modes, and references.',
		defaults: { name: 'OSOP Validate' },
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				displayName: 'OSOP YAML',
				name: 'osopYaml',
				type: 'string',
				typeOptions: { rows: 10 },
				default: '',
				description: 'OSOP YAML content to validate.',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const results: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			const osopYaml = this.getNodeParameter('osopYaml', i) as string || (items[i].json as any).osop_yaml || '';
			const errors: string[] = [];
			const warnings: string[] = [];

			let data: any;
			try {
				data = yaml.load(osopYaml);
			} catch (e: any) {
				results.push({ json: { valid: false, errors: [`YAML parse error: ${e.message}`], warnings: [] } });
				continue;
			}

			if (!data || typeof data !== 'object') {
				results.push({ json: { valid: false, errors: ['Content must be a YAML mapping'], warnings: [] } });
				continue;
			}

			if (!data.osop_version) errors.push('Missing required: osop_version');
			if (!data.id) errors.push('Missing required: id');
			if (!data.nodes) errors.push('Missing required: nodes');
			if (!data.edges) errors.push('Missing required: edges');

			const nodeIds = new Set<string>();
			for (const n of data.nodes || []) {
				if (!n.id) { errors.push('Node missing id'); continue; }
				if (nodeIds.has(n.id)) errors.push(`Duplicate node id: ${n.id}`);
				nodeIds.add(n.id);
				if (n.type && !VALID_TYPES.has(n.type)) warnings.push(`Node '${n.id}': unknown type '${n.type}'`);
			}

			for (const e of data.edges || []) {
				if (!e.from) errors.push('Edge missing from');
				else if (!nodeIds.has(e.from)) errors.push(`Edge from unknown node: ${e.from}`);
				if (!e.to) errors.push('Edge missing to');
				else if (!nodeIds.has(e.to)) errors.push(`Edge to unknown node: ${e.to}`);
				if (e.mode && !VALID_MODES.has(e.mode)) warnings.push(`Edge: unknown mode '${e.mode}'`);
			}

			results.push({
				json: {
					valid: errors.length === 0,
					node_count: (data.nodes || []).length,
					edge_count: (data.edges || []).length,
					errors,
					warnings,
				},
			});
		}

		return [results];
	}
}
