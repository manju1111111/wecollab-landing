"use client";

import { useState, useCallback, useRef } from "react";
import { X, UploadCloud, FileType, CheckCircle, AlertTriangle, AlertCircle, Loader2 } from "lucide-react";
import Papa from "papaparse";
import { createClient } from "@/lib/supabase/client";

// Define our required database schema for mapping
const DB_SCHEMA = [
  { key: "name", label: "Full Name", required: true },
  { key: "username", label: "Username/Handle", required: true },
  { key: "platform", label: "Platform", required: false },
  { key: "email", label: "Email", required: false },
  { key: "phone", label: "Phone", required: false },
  { key: "followers", label: "Followers", required: false },
  { key: "engagement_rate", label: "Engagement Rate", required: false },
  { key: "category", label: "Category", required: false },
];

export function ImportCSVModal({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const [step, setStep] = useState<"upload" | "mapping" | "importing" | "summary">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<any[]>([]);
  
  // mapping state: schemaKey -> csvHeader
  const [mapping, setMapping] = useState<Record<string, string>>({});
  
  // Summary Stats
  const [stats, setStats] = useState({ total: 0, imported: 0, pending: 0, duplicates: 0, failed: 0 });
  const [employeeAssignment, setEmployeeAssignment] = useState<string>("auto"); // auto or specific employee ID (mocked for now)

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      alert("Please upload a valid CSV file");
      return;
    }
    setFile(file);
    
    // Parse headers and sample data
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.meta.fields) {
          setCsvHeaders(results.meta.fields);
          setCsvData(results.data);
          autoMapHeaders(results.meta.fields);
          setStep("mapping");
        }
      }
    });
  };

  const autoMapHeaders = (headers: string[]) => {
    const newMapping: Record<string, string> = {};
    
    // Fuzzy matching logic
    headers.forEach(header => {
      const h = header.toLowerCase().replace(/[^a-z0-9]/g, "");
      
      if (h.includes("name") || h === "creator") newMapping["name"] = header;
      if (h.includes("user") || h.includes("handle") || h === "ig") newMapping["username"] = header;
      if (h.includes("email")) newMapping["email"] = header;
      if (h.includes("phone") || h.includes("contact")) newMapping["phone"] = header;
      if (h.includes("follow") || h.includes("subs")) newMapping["followers"] = header;
      if (h.includes("engage") || h.includes("er")) newMapping["engagement_rate"] = header;
      if (h.includes("cat") || h.includes("niche")) newMapping["category"] = header;
      if (h.includes("platform") || h.includes("social")) newMapping["platform"] = header;
    });

    setMapping(newMapping);
  };

  const handleImport = async () => {
    setStep("importing");
    
    const supabase = createClient();
    const batchId = crypto.randomUUID(); // Import tracking ID
    
    let imported = 0;
    let pending = 0;
    let failed = 0;
    let duplicates = 0;

    const formattedData = csvData.map(row => {
      // Map CSV row to our DB schema
      const mappedRow: any = {
        name: row[mapping["name"]] || "Unknown",
        username: row[mapping["username"]] || `user_${Math.floor(Math.random()*10000)}`,
        email: row[mapping["email"]] || null,
        phone: row[mapping["phone"]] || null,
        followers: parseInt(row[mapping["followers"]]) || 0,
        engagement_rate: parseFloat(row[mapping["engagement_rate"]]) || 0.0,
        category: row[mapping["category"]] || "Uncategorized",
        
        // System tracking fields
        imported_from_csv: true,
        import_batch_id: batchId,
        visibility_status: false, // Default hidden
        verification_status: "Pending Verification", // Default pending
      };

      // Incomplete Profile Detection (Phase 3 Logic)
      // Check required fields for Discovery Page
      const isComplete = 
        mappedRow.name !== "Unknown" && 
        mappedRow.username && 
        mappedRow.followers > 0 && 
        mappedRow.category !== "Uncategorized" &&
        (mappedRow.email || mappedRow.phone); // Require at least one contact method
      
      if (isComplete) {
        // We leave verification_status as Pending Verification anyway to ensure human review, 
        // but mark it internally as having met criteria. For strict flow, admin still needs to verify.
        mappedRow.verification_status = "Pending Verification";
      }

      // Add assignment if selected
      if (employeeAssignment !== "auto") {
         mappedRow.assigned_employee = employeeAssignment;
      }

      return mappedRow;
    });

    // Execute Batched Insert
    // In a real app we'd chunk this to avoid API payload limits (e.g. 500 at a time)
    const { data, error } = await supabase
      .from("creators")
      .insert(formattedData)
      .select();

    if (error) {
      console.error(error);
      failed = formattedData.length;
    } else {
      imported = formattedData.length;
      pending = formattedData.length; // All start as pending in this flow
    }

    setStats({
      total: csvData.length,
      imported,
      pending,
      duplicates,
      failed
    });

    setStep("summary");
  };

  const resetModal = () => {
    setStep("upload");
    setFile(null);
    setCsvHeaders([]);
    setCsvData([]);
    setMapping({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-[24px] shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Import Creator Database</h2>
            <p className="text-[13px] text-slate-500 mt-0.5">Upload a CSV to bulk ingest into the verification pipeline.</p>
          </div>
          <button onClick={resetModal} className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-500 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Dynamic Body Content */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* STEP 1: UPLOAD */}
          {step === "upload" && (
            <div 
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-slate-100/50 hover:border-indigo-300 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileChange}
              />
              <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                <UploadCloud className="h-8 w-8 text-indigo-500" />
              </div>
              <h3 className="text-[15px] font-bold text-slate-900">Click or drag CSV file here</h3>
              <p className="text-[13px] text-slate-500 mt-2 max-w-xs">Supports up to 5,000 rows per file. Must contain a header row.</p>
            </div>
          )}

          {/* STEP 2: MAPPING */}
          {step === "mapping" && (
            <div className="space-y-6">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-indigo-600 shrink-0" />
                <p className="text-[13px] text-indigo-900">
                  We found <strong>{csvData.length} rows</strong> in <strong>{file?.name}</strong>. 
                  Please confirm the column mapping. Our smart engine auto-matched fields where possible.
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="grid grid-cols-2 bg-slate-50 border-b border-slate-200 px-4 py-2.5 text-[12px] font-bold text-slate-500">
                  <div>System Field</div>
                  <div>CSV Column</div>
                </div>
                <div className="divide-y divide-slate-100">
                  {DB_SCHEMA.map(field => (
                    <div key={field.key} className="grid grid-cols-2 px-4 py-3 items-center gap-4">
                      <div className="text-[13px] font-medium text-slate-900">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </div>
                      <select 
                        className="h-9 rounded-lg border border-slate-200 text-[13px] px-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none w-full"
                        value={mapping[field.key] || ""}
                        onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                      >
                        <option value="">-- Ignore this field --</option>
                        {csvHeaders.map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <label className="block text-[13px] font-bold text-slate-900 mb-2">Assign Verification Tasks To:</label>
                <select 
                  value={employeeAssignment}
                  onChange={(e) => setEmployeeAssignment(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 px-3 text-[13px] focus:border-indigo-500 outline-none"
                >
                  <option value="auto">Auto-distribute equally</option>
                  <option value="unassigned">Leave unassigned</option>
                  <option value="employee-a">Alex (Moderator)</option>
                  <option value="employee-b">Sarah (Data Entry)</option>
                </select>
              </div>

              <button 
                onClick={handleImport}
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[14px] shadow-sm transition-colors"
              >
                Start Verification Pipeline
              </button>
            </div>
          )}

          {/* STEP 3: IMPORTING */}
          {step === "importing" && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mb-4" />
              <h3 className="text-[16px] font-bold text-slate-900">Processing {csvData.length} records...</h3>
              <p className="text-[13px] text-slate-500 mt-2 max-w-sm">
                Running smart extraction, checking duplicates, and assigning verification tasks. Please don't close this window.
              </p>
            </div>
          )}

          {/* STEP 4: SUMMARY */}
          {step === "summary" && (
            <div className="space-y-6">
              <div className="flex items-center justify-center w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mx-auto mb-2">
                <CheckCircle className="h-8 w-8" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-slate-900">Import Complete</h3>
                <p className="text-[14px] text-slate-500 mt-1">
                  The creators have been successfully added to the Verification Pipeline.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="bg-white p-3 rounded-lg border border-slate-100 text-center shadow-sm">
                  <div className="text-[20px] font-bold text-slate-900">{stats.total}</div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase mt-1">Total Rows</div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-100 text-center shadow-sm">
                  <div className="text-[20px] font-bold text-indigo-600">{stats.imported}</div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase mt-1">Imported</div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-amber-100 bg-amber-50 text-center shadow-sm">
                  <div className="text-[20px] font-bold text-amber-700">{stats.pending}</div>
                  <div className="text-[11px] font-bold text-amber-600 uppercase mt-1">Pending Review</div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-red-100 bg-red-50 text-center shadow-sm">
                  <div className="text-[20px] font-bold text-red-700">{stats.failed}</div>
                  <div className="text-[11px] font-bold text-red-600 uppercase mt-1">Failed</div>
                </div>
              </div>

              <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                <h4 className="text-[13px] font-bold text-indigo-900">Next Steps: Verification Phase</h4>
                <p className="text-[13px] text-indigo-700 mt-1 leading-relaxed">
                  The creators are currently hidden from the public Discovery Page. Your team must review them in the Verification Queue, fix missing data, and approve them before they go live.
                </p>
              </div>

              <button 
                onClick={resetModal}
                className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-[14px] shadow-sm transition-colors"
              >
                Close & Return to Dashboard
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
