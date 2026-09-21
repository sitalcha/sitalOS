import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, join } from "path";
import { gzipSync, brotliCompressSync, constants } from "zlib";
import { spawnSync } from "child_process";

function ensurePapirusData() {
  const base = resolve(process.cwd(), "src/generated");
  const availPath = join(base, "papirus-available.json");
  const symPath = join(base, "papirus-symlinks.json");
  if (existsSync(availPath) && existsSync(symPath)) return;
  try {
    mkdirSync(base, { recursive: true });
  } catch {}
  const genScript = resolve(process.cwd(), "scripts/generatePapirusData.js");
  if (existsSync(genScript)) {
    const res = spawnSync("node", [genScript], { stdio: "inherit", cwd: process.cwd() });
    if (res.status === 0 && existsSync(availPath) && existsSync(symPath)) return;
  }
  if (!existsSync(availPath) || !existsSync(symPath)) {
    console.warn(
      "[papirus] papirus data missing and generatePapirusData.js failed or not found. Build will fail without real papirus-available.json"
    );
  }
}

function compressPapirusData() {
  ensurePapirusData();
  const base = resolve(process.cwd(), "src/generated");
  const files = ["papirus-available.json", "papirus-symlinks.json"];
  for (const name of files) {
    const jsonPath = join(base, name);
    if (!existsSync(jsonPath)) continue;
    if (existsSync(`${jsonPath}.gz`) && existsSync(`${jsonPath}.br`)) continue;
    const data = readFileSync(jsonPath);
    const gz = gzipSync(data, { level: 9, mtime: 0 });
    writeFileSync(`${jsonPath}.gz`, gz);
    try {
      const br = brotliCompressSync(data, {
        params: { [constants.BROTLI_PARAM_QUALITY]: 11 }
      });
      writeFileSync(`${jsonPath}.br`, br);
    } catch {}
  }
}

export function papirusDataPlugin() {
  return {
    name: "yukios-papirus-data",
    buildStart() {
      compressPapirusData();
    },
    configureServer(server) {
      compressPapirusData();
    }
  };
}
