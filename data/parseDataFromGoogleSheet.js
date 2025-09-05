const fs = require('fs');
const fetch = require('node-fetch');

const parseFromGoogleSheet = async () => {
  const d3dsv = await import('d3-dsv');

  // Google Sheet ID from your URL
  const SHEET_ID = '1xMLrp1nNKhQeHAnBdN-BpDdjVj_uuLIV06hKPe8wtBk';
  
  // Function to fetch CSV data from Google Sheet using node-fetch
  const fetchCSVFromSheet = async (sheetId, gid = 0) => {
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.text();
      return data;
    } catch (error) {
      console.error(`Error fetching sheet ${gid}:`, error.message);
      throw error;
    }
  };

  try {
    // Fetch data from Google Sheets using the correct gid values    
    const modelRaw = await fetchCSVFromSheet(SHEET_ID, 1482534373); // Sheet 1: Logic model data
    const researchRaw = await fetchCSVFromSheet(SHEET_ID, 1030263523); // Sheet 2: Research data
    const headerTooltipsRaw = await fetchCSVFromSheet(SHEET_ID, 459672780); // Sheet 3: Header tooltips
    const inputTooltipsRaw = await fetchCSVFromSheet(SHEET_ID, 304412178); // Sheet 4: Input tooltips

    const arrayify = multilineRow => {
      // Add null/undefined check
      if (!multilineRow || multilineRow === '') {
        return [];
      }
      return multilineRow
        .split('\n')
        .map(item => item.trim())
        .filter(item => item);
    };

    const getUnique = (data, key) => {
      return [...new Set(data.map(row => arrayify(row[key])).flat())];
    };

    const model = d3dsv.csvParse(modelRaw);
    const research = d3dsv.csvParse(researchRaw);
    const headerTooltips = d3dsv.csvParseRows(headerTooltipsRaw);
    const inputTooltips = d3dsv.csvParse(inputTooltipsRaw);

    // 🔍 DEBUG: Let's see what columns are available
    console.log('📊 Available columns in main sheet:');
    if (model.length > 0) {
      console.log(Object.keys(model[0]));
      console.log('\n📋 Sample row data:');
      console.log(model[0]);
    }

    const inputs = getUnique(model, 'Inputs');
    const partners = getUnique(model, 'Partners');
    const outputs = getUnique(model, 'Output');
    const immediateOutputs = getUnique(model, 'Immediate Outcomes');
    const intermediateOutputs = getUnique(model, 'Intermediate Outcomes');
    const longTermOutputs = getUnique(model, 'Long-term Outcomes');

    const strategies = Object.fromEntries(
      model.map(row => [
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
    console.log('🎯 Impact Goal loaded from Google Sheet:', impactGoal);

    const data = {
      headerTooltips: headerTooltips.map(t => t[1]),
      inputs,
      inputTooltips: inputs.map(
        input => inputTooltips.find(t => t['Inputs Condensed'] === input)['Description'],
      ),
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
    console.log('✅ Data successfully parsed from Google Sheet and saved to data.json');
  } catch (error) {
    console.error('Error fetching or parsing data from Google Sheet:', error);
  }
};

// Show expected columns first, then run the parser
parseFromGoogleSheet(); 