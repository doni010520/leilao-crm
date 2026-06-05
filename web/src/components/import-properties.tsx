"use client";

import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, Check, AlertTriangle, Download, X, ArrowRight } from "lucide-react";
import { Button, Card, EmptyState } from "@/components/ui";
import { cn } from "@/lib/utils";

interface ParsedRow {
  [key: string]: string | number | null;
}

interface ColumnMapping {
  source: string;
  target: string;
}

const TARGET_COLUMNS = [
  { key: "endereco", label: "Endereço", required: true },
  { key: "cidade", label: "Cidade", required: true },
  { key: "estado", label: "Estado (UF)", required: true },
  { key: "tipo_imovel", label: "Tipo (apto/casa/terreno)", required: false },
  { key: "valor_avaliacao", label: "Valor de avaliação", required: false },
  { key: "lance_minimo", label: "Lance mínimo", required: true },
  { key: "desconto_pct", label: "Desconto (%)", required: false },
  { key: "area_privativa", label: "Área (m²)", required: false },
  { key: "quartos", label: "Quartos", required: false },
  { key: "vagas", label: "Vagas", required: false },
  { key: "bairro", label: "Bairro", required: false },
  { key: "banco", label: "Banco", required: false },
  { key: "leiloeiro", label: "Leiloeiro", required: false },
  { key: "tipo_leilao", label: "Tipo de leilão", required: false },
  { key: "praca", label: "Praça (1ª/2ª)", required: false },
  { key: "data_leilao", label: "Data do leilão", required: false },
  { key: "ocupacao", label: "Ocupação", required: false },
  { key: "aceita_financiamento", label: "Aceita financiamento", required: false },
  { key: "edital_url", label: "Link do edital", required: false },
  { key: "notas", label: "Observações", required: false },
];

export function ImportProperties() {
  const [step, setStep] = useState<"upload" | "mapping" | "preview" | "done">("upload");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setFileName(file.name);
    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "csv" || ext === "tsv") {
      const text = await file.text();
      const sep = ext === "tsv" ? "\t" : ",";
      const lines = text.split("\n").filter(l => l.trim());
      const hdrs = lines[0].split(sep).map(h => h.trim().replace(/^"|"$/g, ""));
      const data = lines.slice(1).map(line => {
        const vals = line.split(sep).map(v => v.trim().replace(/^"|"$/g, ""));
        const row: ParsedRow = {};
        hdrs.forEach((h, i) => { row[h] = vals[i] || null; });
        return row;
      });
      setHeaders(hdrs);
      setRows(data);
      autoMap(hdrs);
      setStep("mapping");
    } else if (ext === "xlsx" || ext === "xls") {
      const { read, utils } = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = read(buf);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = utils.sheet_to_json<ParsedRow>(ws, { defval: null });
      if (json.length > 0) {
        const hdrs = Object.keys(json[0]);
        setHeaders(hdrs);
        setRows(json);
        autoMap(hdrs);
        setStep("mapping");
      }
    }
  }

  function autoMap(hdrs: string[]) {
    const maps: ColumnMapping[] = [];
    const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
    for (const target of TARGET_COLUMNS) {
      const norm = normalize(target.key);
      const normLabel = normalize(target.label);
      const match = hdrs.find(h => {
        const nh = normalize(h);
        return nh === norm || nh === normLabel || nh.includes(norm) || norm.includes(nh);
      });
      if (match) maps.push({ source: match, target: target.key });
    }
    setMappings(maps);
  }

  function getMapping(targetKey: string): string {
    return mappings.find(m => m.target === targetKey)?.source || "";
  }

  function setMapping(targetKey: string, sourceCol: string) {
    setMappings(prev => {
      const next = prev.filter(m => m.target !== targetKey);
      if (sourceCol) next.push({ source: sourceCol, target: targetKey });
      return next;
    });
  }

  function getMappedValue(row: ParsedRow, targetKey: string): string {
    const src = getMapping(targetKey);
    if (!src) return "";
    const val = row[src];
    return val !== null && val !== undefined ? String(val) : "";
  }

  const requiredMapped = TARGET_COLUMNS.filter(c => c.required).every(c => getMapping(c.key));

  function handleImport() {
    setImporting(true);
    setTimeout(() => {
      setImporting(false);
      setStep("done");
    }, 2000);
  }

  function downloadTemplate() {
    const header = TARGET_COLUMNS.map(c => c.label).join(",");
    const example = "Rua Augusta 1200 Apto 42,São Paulo,SP,apartamento,520000,312000,40,68,2,1,Consolação,Caixa Econômica Federal,Superbid,extrajudicial,2ª,2026-07-15,ocupado,não,,";
    const csv = header + "\n" + example + "\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "modelo-imoveis-imobleilao.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  if (step === "done") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-up">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-bg">
          <Check size={32} className="text-green-600" />
        </div>
        <h3 className="mt-4 font-display text-lg font-bold text-ink">{rows.length} imóveis importados!</h3>
        <p className="mt-2 text-sm text-ink-soft">Os imóveis já estão disponíveis na base da IA e na aba &quot;Todos os imóveis&quot;.</p>
        <Button onClick={() => { setStep("upload"); setRows([]); setHeaders([]); setFileName(""); }} variant="ghost" className="mt-6">
          Importar outra planilha
        </Button>
      </div>
    );
  }

  if (step === "upload") {
    return (
      <div className="animate-fade-up">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-display text-base font-bold text-ink">Importar imóveis por planilha</h3>
            <p className="text-sm text-ink-soft">Envie um arquivo .xlsx ou .csv com os dados dos imóveis</p>
          </div>
          <button onClick={downloadTemplate} className="flex items-center gap-1.5 text-sm font-medium text-accent hover:underline">
            <Download size={15} /> Baixar modelo
          </button>
        </div>

        <button
          onClick={() => fileRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-4 rounded-card border-2 border-dashed border-stone-300 bg-surface/50 py-16 transition-all hover:border-accent hover:bg-accent-light/30"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-light">
            <Upload size={28} className="text-brand" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-ink">Clique para selecionar o arquivo</p>
            <p className="mt-1 text-xs text-ink-soft">Aceita .xlsx, .xls e .csv — máximo 5.000 linhas</p>
          </div>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv,.tsv"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />

        <Card className="mt-6">
          <h4 className="text-sm font-semibold text-ink">Dicas para a planilha</h4>
          <ul className="mt-2 space-y-1.5 text-xs text-ink-soft">
            <li className="flex items-start gap-2"><Check size={12} className="mt-0.5 shrink-0 text-green-600" /> A primeira linha deve ser o cabeçalho (nome das colunas)</li>
            <li className="flex items-start gap-2"><Check size={12} className="mt-0.5 shrink-0 text-green-600" /> Colunas obrigatórias: <strong>Endereço, Cidade, Estado, Lance mínimo</strong></li>
            <li className="flex items-start gap-2"><Check size={12} className="mt-0.5 shrink-0 text-green-600" /> Valores em reais sem R$, pontos ou vírgulas (ex.: 312000)</li>
            <li className="flex items-start gap-2"><Check size={12} className="mt-0.5 shrink-0 text-green-600" /> Datas no formato AAAA-MM-DD (ex.: 2026-07-15)</li>
          </ul>
        </Card>
      </div>
    );
  }

  if (step === "mapping") {
    return (
      <div className="animate-fade-up">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-display text-base font-bold text-ink">Mapear colunas</h3>
            <p className="text-sm text-ink-soft">
              <FileSpreadsheet size={14} className="mr-1 inline" />
              {fileName} — {rows.length} linhas encontradas
            </p>
          </div>
          <button onClick={() => setStep("upload")} className="text-sm text-ink-soft hover:text-danger">
            <X size={16} className="inline" /> Cancelar
          </button>
        </div>

        <Card className="mb-4">
          <p className="mb-4 text-xs text-ink-soft">
            Associe cada coluna da sua planilha ao campo correspondente. Colunas com <span className="text-danger">*</span> são obrigatórias.
          </p>
          <div className="space-y-3">
            {TARGET_COLUMNS.map(col => (
              <div key={col.key} className="flex items-center gap-3">
                <div className="w-44 shrink-0">
                  <span className="text-sm text-ink">{col.label}</span>
                  {col.required && <span className="ml-1 text-danger">*</span>}
                </div>
                <ArrowRight size={14} className="shrink-0 text-stone-300" />
                <select
                  value={getMapping(col.key)}
                  onChange={e => setMapping(col.key, e.target.value)}
                  className={cn(
                    "flex-1 rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-brand",
                    getMapping(col.key) ? "border-green-300 text-ink" : col.required ? "border-red-200 text-stone-400" : "border-stone-200 text-stone-400"
                  )}
                >
                  <option value="">— Não mapear —</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            ))}
          </div>
        </Card>

        {!requiredMapped && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
            <AlertTriangle size={16} /> Mapeie todas as colunas obrigatórias antes de continuar.
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setStep("upload")}>Voltar</Button>
          <Button disabled={!requiredMapped} onClick={() => setStep("preview")}>
            Ver preview <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    );
  }

  // step === "preview"
  const previewRows = rows.slice(0, 10);
  const visibleCols = TARGET_COLUMNS.filter(c => getMapping(c.key));

  return (
    <div className="animate-fade-up">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-display text-base font-bold text-ink">Preview da importação</h3>
          <p className="text-sm text-ink-soft">Mostrando as 10 primeiras de {rows.length} linhas. Confira se os dados estão corretos.</p>
        </div>
        <button onClick={() => setStep("mapping")} className="text-sm text-ink-soft hover:text-ink">
          ← Voltar ao mapeamento
        </button>
      </div>

      <div className="overflow-x-auto rounded-card border border-stone-200/60">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand text-white">
            <tr>
              {visibleCols.map(c => (
                <th key={c.key} className="whitespace-nowrap px-3 py-2 text-xs font-semibold">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-stone-50"}>
                {visibleCols.map(c => (
                  <td key={c.key} className="whitespace-nowrap px-3 py-2 text-xs text-ink">
                    {getMappedValue(row, c.key) || <span className="text-stone-300">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-ink-soft">
          {rows.length} imóveis serão adicionados à base da IA com fonte <code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs">upload</code>
        </p>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => setStep("mapping")}>Voltar</Button>
          <Button onClick={handleImport} disabled={importing}>
            {importing ? "Importando..." : `Importar ${rows.length} imóveis`}
          </Button>
        </div>
      </div>
    </div>
  );
}
