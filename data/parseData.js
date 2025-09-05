const fs = require('fs');

const parse = async () => {
  const d3dsv = await import('d3-dsv');

  const modelRaw = fs.readFileSync('./logic_model_expanded.csv', { encoding: 'utf8' });
  const researchRaw = fs.readFileSync('./research.csv', { encoding: 'utf8' });
  const headerTootipsRaw = fs.readFileSync('./header_tooltips.csv', { encoding: 'utf8' });
  const inputTooltipsRaw = fs.readFileSync('./input_tooltips.csv', { encoding: 'utf8' });

  const arrayify = multilineRow => {
    if (!multilineRow) return []; // Handle undefined/null values
    return multilineRow
      .split('\n')
      .map(item => item.trim())
      .filter(item => item);
  };

  const getUnique = (data, key) => {
    return [...new Set(data.map(row => arrayify(row[key])).flat())].filter(item => item);
  };

  const model = d3dsv.csvParse(modelRaw);
  const research = d3dsv.csvParse(researchRaw);
  const headerTooltips = d3dsv.csvParseRows(headerTootipsRaw);
  const inputTooltips = d3dsv.csvParse(inputTooltipsRaw);

  const inputs = getUnique(model, 'Inputs');
  // Since PBC Component column doesn't exist yet, create placeholder data
  const pbcComponents = ['Economic Vitality', 'Education', 'Community Vibrancy'];
  const partners = getUnique(model, 'Partners');
  const outputs = getUnique(model, 'Output');
  const immediateOutputs = getUnique(model, 'Immediate Outcomes');
  const intermediateOutputs = getUnique(model, 'Intermediate Outcomes');
  const longTermOutputs = getUnique(model, 'Long-term Outcomes');

  const strategies = Object.fromEntries(
    model.map((row, index) => [
      row.Strategy.trim(),
      {
        label: row.Strategy,
        details: row['Paragraph description'],
        activities: row['Activities'] || '', // Add Activities column
        outputs: arrayify(row.Output).map(output => outputs.indexOf(output)),
        immediateOutputs: arrayify(row['Immediate Outcomes']).map(output =>
          immediateOutputs.indexOf(output),
        ),
        intermediateOutputs: arrayify(row['Intermediate Outcomes']).map(output =>
          intermediateOutputs.indexOf(output),
        ),
        // All long term outputs are associated with every strategy
        longTermOutputs: longTermOutputs.map((_, i) => i),
        // Assign placeholder PBC Components - distribute strategies across the three components
        pbcComponents: [index % 3], // This will cycle through 0, 1, 2 (Economic Vitality, Education, Community Vibrancy)
        partners: arrayify(row.Partners).map(partner => partners.indexOf(partner)),
        research: [],
      },
    ]),
  );

  // Get Impact Goal - it's the same for all rows, find first non-empty one
  const impactGoal = model.reduce((goal, row) => {
    if (goal) return goal; // If we already found a goal, keep it
    return (row['Impact Goal'] || '').trim(); // Otherwise try this row
  }, '');

  const data = {
    headerTooltips: headerTooltips.map(t => t[1]),
    inputs,
    inputTooltips: inputs.map(
      input => inputTooltips.find(t => t['Inputs Condensed'] === input)['Description'],
    ),
    pbcComponents,
    strategies,
    partners,
    outputs,
    immediateOutputs,
    intermediateOutputs,
    longTermOutputs,
    impactGoal,
  };

  research.forEach(r => {
    const researchStrategy = r.Strategy.trim();
    if (!data.strategies[researchStrategy]) {
      console.log(`No strategy found for ${researchStrategy}`);
      return;
    }
    const citationSanitized = r['Citation'].split('http');
    if (citationSanitized.length !== 2) {
      console.log('Error processing citation', r['Citation']);
    }
    const relatedOutcome = r['Related Outcome'].trim();
    const researchDatum = {
      citation: citationSanitized[0],
      citationLinkText: 'http' + citationSanitized[1],
      citationLink: r['Citation Link'],
      relatedOutcomes: [relatedOutcome],
    };
    const match = data.strategies[researchStrategy].research.find(
      rs => rs.citation === researchDatum.citation,
    );
    if (!match) {
      data.strategies[researchStrategy].research.push(researchDatum);
    } else {
      if (!match.relatedOutcomes.includes(relatedOutcome)) {
        match.relatedOutcomes.push(relatedOutcome);
      }
    }
  });

  Object.entries(data.strategies).forEach(([_, strategy], i) => {
    // Alphabetize research ignoring any leading smartquotes
    strategy.research.sort((a, b) => {
      return a.citation.replace('"', '').localeCompare(b.citation.replace('"', ''));
    });
  });

  fs.writeFileSync('../docs/assets/data.json', JSON.stringify(data), 'utf8');
};

parse();
