import AdmZip from 'adm-zip';
import * as fs from 'fs/promises';
import * as path from 'path';

interface NameEntry {
  name: string;
  rank: number;
  count: number;
  gender?: 'M' | 'F';
}

function parseNameLines(data: string): NameEntry[] {
  return data
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line, index) => {
      const [name, gender, countStr] = line.split(',');
      return {
        name: name ?? '',
        gender: gender === 'M' || gender === 'F' ? gender : undefined,
        count: parseInt(countStr ?? '0', 10),
        rank: index + 1,
      };
    });
}

function latestYearNameFile(zip: AdmZip): AdmZip.IZipEntry | undefined {
  return zip
    .getEntries()
    .filter((entry: AdmZip.IZipEntry) => /^yob\d{4}\.txt$/.test(entry.entryName))
    .sort((a: AdmZip.IZipEntry, b: AdmZip.IZipEntry) =>
      b.entryName.localeCompare(a.entryName)
    )[0];
}

async function downloadAndSaveSSANames(): Promise<void> {
  console.log('Downloading SSA first name data...');
  const response = await fetch('https://www.ssa.gov/oact/babynames/names.zip');
  if (!response.ok) {
    throw new Error(`SSA download failed: HTTP ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const zip = new AdmZip(buffer);
  const nameFile = latestYearNameFile(zip);
  if (!nameFile) {
    throw new Error('Could not find yobYYYY.txt name data in ZIP file');
  }

  console.log(`Using ${nameFile.entryName}`);
  const data = nameFile.getData().toString('utf8');
  const names = parseNameLines(data);
  const topNames = names.slice(0, 10000);

  const outputPath = path.resolve(__dirname, '../src/data/first-names.json');
  await fs.writeFile(outputPath, JSON.stringify(topNames, null, 2));

  console.log(`Successfully downloaded and saved ${topNames.length} first names to ${outputPath}`);
}

downloadAndSaveSSANames().catch((error: unknown) => {
  console.error('Error downloading SSA names:', error);
  process.exitCode = 1;
});
