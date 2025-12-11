import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import Modal from './Modal';
import { Upload, ArrowRight, Check, AlertTriangle } from 'lucide-react';

// Required Fields Config
// Passed as props: fieldConfig = [{ key: 'name', label: 'Name', required: true }, ...]

const ImportWizard = ({ isOpen, onClose, onImport, fieldConfig, title = "Import" }) => {
    const [step, setStep] = useState(1); // 1: Upload, 2: Map, 3: Review
    const [fileData, setFileData] = useState([]);
    const [headers, setHeaders] = useState([]);
    const [mapping, setMapping] = useState({}); // { dbField: csvHeader }
    const [previewData, setPreviewData] = useState([]);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 }); // Array of arrays

            if (data.length > 0) {
                setHeaders(data[0]); // First row is header
                const rows = XLSX.utils.sheet_to_json(ws); // Objects using first row as key
                setFileData(rows);

                // Auto-map if headers match labels or keys matches
                const initialMap = {};
                fieldConfig.forEach(field => {
                    // Try exact matches
                    const match = data[0].find(h =>
                        h.toLowerCase().trim() === field.label.toLowerCase() ||
                        h.toLowerCase().trim() === field.key.toLowerCase()
                    );
                    if (match) initialMap[field.key] = match;
                });
                setMapping(initialMap);

                setStep(2);
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleMapChange = (fieldKey, header) => {
        setMapping(prev => ({ ...prev, [fieldKey]: header }));
    };

    const handlePreview = () => {
        // Transform data
        const transformed = fileData.map(row => {
            const newObj = {};
            fieldConfig.forEach(field => {
                const csvHeader = mapping[field.key];
                if (csvHeader) {
                    newObj[field.key] = row[csvHeader];
                }
            });
            return newObj;
        });
        setPreviewData(transformed);
        setStep(3);
    };

    const handleSubmit = () => {
        // Validate required fields?
        onImport(previewData);
        // Reset
        setStep(1);
        setFileData([]);
        setHeaders([]);
        setMapping({});
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} width="600px">
            <div className="wizard-container">
                {/* Stepper */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
                    <span style={{ fontWeight: step === 1 ? 'bold' : 'normal', color: step === 1 ? 'var(--primary-color)' : '#888' }}>1. Upload</span>
                    <span style={{ fontWeight: step === 2 ? 'bold' : 'normal', color: step === 2 ? 'var(--primary-color)' : '#888' }}>2. Map Columns</span>
                    <span style={{ fontWeight: step === 3 ? 'bold' : 'normal', color: step === 3 ? 'var(--primary-color)' : '#888' }}>3. Preview</span>
                </div>

                {step === 1 && (
                    <div style={{ textAlign: 'center', padding: '2rem', border: '2px dashed #ccc', borderRadius: '8px' }}>
                        <Upload size={48} color="#ccc" />
                        <p style={{ margin: '1rem 0' }}>Upload CSV or Excel file</p>
                        <input type="file" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} />
                    </div>
                )}

                {step === 2 && (
                    <div>
                        <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#666' }}>
                            Map the columns from your file to the application fields.
                        </p>
                        <div style={{ display: 'grid', gap: '0.8rem' }}>
                            {fieldConfig.map(field => (
                                <div key={field.key} style={{ display: 'grid', gridTemplateColumns: '1fr 20px 1fr', alignItems: 'center' }}>
                                    <div>
                                        <label style={{ fontWeight: 500 }}>{field.label} {field.required && '*'}</label>
                                        <span style={{ fontSize: '0.8rem', color: '#888', display: 'block' }}>DB Field: {field.key}</span>
                                    </div>
                                    <ArrowRight size={16} />
                                    <select
                                        className="input"
                                        value={mapping[field.key] || ''}
                                        onChange={(e) => handleMapChange(field.key, e.target.value)}
                                        style={{ width: '100%' }}
                                    >
                                        <option value="">-- Select Column --</option>
                                        {headers.map(h => (
                                            <option key={h} value={h}>{h}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn btn-primary" onClick={handlePreview}>Next</button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div>
                        <p>Ready to import <strong>{previewData.length}</strong> items.</p>
                        <div style={{ maxHeight: '200px', overflowY: 'auto', background: '#f9fafb', padding: '0.5rem', borderRadius: '4px', margin: '1rem 0' }}>
                            <pre style={{ fontSize: '0.75rem' }}>
                                {JSON.stringify(previewData.slice(0, 3), null, 2)}
                                {previewData.length > 3 && '\n...'}
                            </pre>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', background: '#fffbeb', padding: '0.5rem', borderRadius: '4px', fontSize: '0.85rem' }}>
                            <AlertTriangle size={16} color="#d97706" />
                            <span>Existing items with the same Name will be updated.</span>
                        </div>
                        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button className="btn btn-secondary" onClick={() => setStep(2)}>Back</button>
                            <button className="btn btn-primary" onClick={handleSubmit}>Import Now</button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default ImportWizard;
