interface TemplateContext {
  leadName: string;
  leadPhone: string;
  productName: string;
  stageName: string;
}

export function resolveTemplate(template: string, context: TemplateContext): string {
  return template
    .replace(/{{leadName}}/g, context.leadName)
    .replace(/{{leadPhone}}/g, context.leadPhone)
    .replace(/{{productName}}/g, context.productName || 'N/A')
    .replace(/{{stageName}}/g, context.stageName || 'N/A');
}

export function validateTemplate(template: string): { valid: boolean; variables: string[] } {
  const regex = /{{(\w+)}}/g;
  const variables: string[] = [];
  let match;
  
  while ((match = regex.exec(template)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }

  const validVariables = ['leadName', 'leadPhone', 'productName', 'stageName'];
  const invalidVariables = variables.filter(v => !validVariables.includes(v));

  return {
    valid: invalidVariables.length === 0,
    variables,
  };
}
