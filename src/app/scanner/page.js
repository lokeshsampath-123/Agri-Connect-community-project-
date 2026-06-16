'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import FallbackImage from '@/components/FallbackImage';
import ErrorBoundary from '@/components/ErrorBoundary';
import { supabase } from '@/lib/supabase';
import { CROP_ASSETS } from '@/lib/assets';

export default function Scanner() {
  const [selectedImages, setSelectedImages] = useState([]);
  const [description, setDescription] = useState('');
  const [cropHint, setCropHint] = useState('Paddy (Rice)');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [userDistrict, setUserDistrict] = useState('Guntur');

  // Fetch past scan history
  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('scans')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      console.warn('Could not load scan history from database:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
    const session = localStorage.getItem('user_profile');
    if (session) {
      const prof = JSON.parse(session);
      if (prof.district) {
        setUserDistrict(prof.district);
      }
    }
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const cropParam = params.get('crop');
      if (cropParam) {
        const match = Object.values(CROP_ASSETS).find(
          c => c.id.toLowerCase() === cropParam.toLowerCase() || c.name.toLowerCase().includes(cropParam.toLowerCase())
        );
        if (match) {
          setCropHint(match.name);
        } else {
          setCropHint(cropParam.charAt(0).toUpperCase() + cropParam.slice(1));
        }
      }
    }
  }, []);

  // Handle local image uploads
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (selectedImages.length + files.length > 5) {
      alert('You can upload up to 5 photos.');
      return;
    }

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImages((prev) => [...prev, {
          file,
          preview: reader.result,
          base64: reader.result
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Run AI diagnosis simulation and API call
  const startAnalysis = async () => {
    if (selectedImages.length === 0) {
      alert('Please upload at least one crop image.');
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);
    setResult(null);

    const steps = [
      'Deconstructing image channels...',
      'Running pathogen signature matching...',
      'Cross-referencing climate variables...',
      'Finalizing agronomic health metrics...'
    ];

    // Progress bar simulation
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 4;
        if (next < 25) setStatusText(steps[0]);
        else if (next < 50) setStatusText(steps[1]);
        else if (next < 75) setStatusText(steps[2]);
        else setStatusText(steps[3]);

        if (next >= 100) {
          clearInterval(interval);
          return 100;
        }
        return next;
      });
    }, 80);

    try {
      // Send the first image base64 to the analyze endpoint
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: selectedImages[0].base64,
          cropHint: cropHint,
          description: description
        })
      });

      const data = await response.json();
      
      // Wait slightly after progress bar hits 100% to show results
      setTimeout(() => {
        setResult(data);
        setIsAnalyzing(false);
        fetchHistory(); // Refresh history list
      }, 2000);

    } catch (err) {
      console.error('Diagnosis failed:', err);
      setIsAnalyzing(false);
      clearInterval(interval);
    }
  };

  const exportReportToPDF = () => {
    if (!result) return;
    
    const scriptId = 'jspdf-cdn-script';
    let script = document.getElementById(scriptId);
    
    const generate = () => {
      try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });
        
        const primaryColor = [16, 107, 60]; 
        const textColor = [40, 40, 40];
        const accentRed = [198, 40, 40];
        
        const pageHeight = doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.width;
        
        // --- PAGE DECORATIONS ---
        doc.setDrawColor(200, 220, 205);
        doc.setLineWidth(0.5);
        doc.rect(5, 5, pageWidth - 10, pageHeight - 10);
        
        // --- HEADER ---
        doc.setFillColor(16, 107, 60);
        doc.circle(25, 25, 10, 'F');
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(255, 255, 255);
        doc.text("AP", 21, 27);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text("GOVERNMENT OF ANDHRA PRADESH", 40, 18);
        doc.setFontSize(12);
        doc.setTextColor(16, 107, 60);
        doc.text("DEPARTMENT OF AGRICULTURE & HORTICULTURE", 40, 24);
        doc.setFontSize(8);
        doc.setTextColor(130, 130, 130);
        doc.text("Verdant Precision Farming Initiative | AgriConnect Portal", 40, 29);
        
        doc.setDrawColor(16, 107, 60);
        doc.setLineWidth(1);
        doc.line(10, 37, pageWidth - 10, 37);
        
        // --- REPORT TITLE ---
        doc.setFont("helvetica", "bold");
        doc.setFontSize(15);
        doc.setTextColor(30, 30, 30);
        doc.text("PRECISION CROP DIAGNOSTIC REPORT", 10, 47);
        
        doc.setFillColor(240, 245, 241);
        doc.rect(10, 52, pageWidth - 20, 18, 'F');
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        
        const scanDate = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        doc.text(`Scan Date/Time: ${scanDate}`, 12, 57);
        doc.text(`Farmer Region: ${userDistrict} District, AP`, 12, 62);
        
        doc.text(`Crop Inspected: ${result.crop_name}`, pageWidth / 2 + 10, 57);
        doc.text(`Diagnostic Code: AC-SCAN-${Math.floor(100000 + Math.random() * 900000)}`, pageWidth / 2 + 10, 62);
        
        // --- SEVERITY & HEALTH INDEX SECTION ---
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(16, 107, 60);
        doc.text("1. HEALTH METRICS", 10, 80);
        
        const score = result.health_score;
        let ratingText = "Healthy";
        let ratingColor = [16, 107, 60]; 
        
        if (score < 50) {
          ratingText = "Critical Infestation";
          ratingColor = [198, 40, 40]; 
        } else if (score < 80) {
          ratingText = "Moderate Damage";
          ratingColor = [230, 120, 0]; 
        }
        
        doc.setFillColor(245, 248, 246);
        doc.rect(10, 84, pageWidth - 20, 24, 'F');
        doc.setDrawColor(ratingColor[0], ratingColor[1], ratingColor[2]);
        doc.setLineWidth(0.8);
        doc.rect(10, 84, pageWidth - 20, 24, 'S');
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        doc.text("Plant Health Index (PHI):", 15, 93);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.setTextColor(ratingColor[0], ratingColor[1], ratingColor[2]);
        doc.text(`${score}`, 15, 103);
        doc.setFontSize(10);
        doc.setTextColor(120, 120, 120);
        doc.text("/ 100", 27, 103);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(50, 50, 50);
        doc.text(`Status: ${ratingText}`, 70, 93);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text(`Confidence level of neural identification: ${(result.confidence * 100).toFixed(1)}%`, 70, 99);
        
        doc.setFillColor(220, 220, 220);
        doc.rect(70, 101, 80, 3, 'F');
        doc.setFillColor(ratingColor[0], ratingColor[1], ratingColor[2]);
        doc.rect(70, 101, 80 * result.confidence, 3, 'F');
        
        // --- PRIMARY DIAGNOSIS ---
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(16, 107, 60);
        doc.text("2. PATHOLOGY / PEST IDENTIFICATION", 10, 118);
        
        doc.setFillColor(245, 248, 246);
        doc.rect(10, 122, pageWidth - 20, 22, 'F');
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(accentRed[0], accentRed[1], accentRed[2]);
        doc.text(result.diagnosis, 15, 131);
        
        if (result.scientific_name && result.scientific_name !== 'N/A') {
          doc.setFont("helvetica", "italic");
          doc.setFontSize(9);
          doc.setTextColor(100, 100, 100);
          doc.text(`Scientific Name: ${result.scientific_name}`, 15, 137);
        }
        
        // --- SYMPTOMS ---
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(16, 107, 60);
        doc.text("3. FIELD OBSERVATIONS & SYMPTOMS", 10, 150);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        
        const splitSymptoms = doc.splitTextToSize(result.symptoms || "Lesions or leaf anomalies noted on structure. Minor cell degradation observed.", pageWidth - 30);
        doc.text(splitSymptoms, 15, 156);
        
        const symptomLinesCount = splitSymptoms.length;
        const remediesY = 156 + (symptomLinesCount * 5) + 6;
        
        // --- AGRONOMICAL REMEDIES ---
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(16, 107, 60);
        doc.text("4. RECOMMENDED ACTION PLAN", 10, remediesY);
        
        let remY = remediesY + 6;
        result.remedies.forEach((rem, idx) => {
          doc.setFillColor(16, 107, 60);
          doc.circle(16, remY - 1.2, 0.8, 'F'); 
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(textColor[0], textColor[1], textColor[2]);
          const splitRem = doc.splitTextToSize(rem, pageWidth - 32);
          doc.text(splitRem, 20, remY);
          remY += (splitRem.length * 5) + 2;
        });
        
        // --- DISCLAIMER & SIGN OFF ---
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.3);
        doc.line(10, pageHeight - 25, pageWidth - 10, pageHeight - 25);
        
        doc.setFont("helvetica", "italic");
        doc.setFontSize(7.5);
        doc.setTextColor(140, 140, 140);
        const disclaimer = "Disclaimer: This is an AI-assisted diagnostic report generated by the AgriConnect Precision farming engine based on visual symptom analysis. Farmers are advised to consult their local Rythu Bharosa Kendra (RBK) agricultural officer before executing heavy chemical pesticide applications.";
        const splitDisclaimer = doc.splitTextToSize(disclaimer, pageWidth - 20);
        doc.text(splitDisclaimer, 10, pageHeight - 20);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(16, 107, 60);
        doc.text("AgriConnect - Empowering Andhra Pradesh Farmers", 10, pageHeight - 10);
        doc.text("Rythu Bharosa Support: 1902", pageWidth - 55, pageHeight - 10);
        
        const sanitizedCrop = result.crop_name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        doc.save(`AgriConnect_Report_${sanitizedCrop}_${Date.now()}.pdf`);
        
      } catch (err) {
        console.error("PDF generation failed:", err);
        alert("Failed to export PDF: " + err.message);
      }
    };
    
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.onload = generate;
      document.body.appendChild(script);
    } else {
      generate();
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      // Simulating voice speech-to-text
      setTimeout(() => {
        setDescription('Noticeable yellowish spots on the lower leaf stems starting 3 days ago. Crop seems wilted.');
        setIsRecording(false);
      }, 2500);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 ml-0 lg:ml-[288px] pt-16 min-h-screen w-full overflow-x-hidden">
        <header className="flex justify-between items-center h-16 px-8 sticky top-0 bg-white/80 backdrop-blur-md border-b border-outline-variant/50 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}
              className="lg:hidden p-1.5 rounded-xl text-primary hover:bg-surface-container flex items-center justify-center shrink-0 border border-outline-variant/50"
              title="Open Menu"
            >
              <span className="material-symbols-outlined text-[20px]">menu</span>
            </button>
            <h2 className="font-headline text-2xl font-bold text-primary">AI Crop Health Scanner</h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 border-l border-outline-variant pl-6">
              <span className="text-on-surface-variant font-semibold text-sm">{userDistrict} Region</span>
              <div className="w-8 h-8 rounded-full border border-outline-variant shadow-sm overflow-hidden bg-surface-container flex items-center justify-center font-bold text-primary">
                F
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-8">
          {/* Banner */}
          <div className="relative h-48 rounded-[2rem] overflow-hidden group shadow-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              alt="Crop background" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC-UPEOPSo2xwozhzu02YSMxlmwhzHclpGiWkLKyeFDBWEdruw8GT3BCqRdJuOcYwN2Vu0KImaErqDNDO-_eoYTIgfMCBgSTRUUfMqmZICu33gwNS4BEcUBQsnDIhZxEnndR_EarpOEaeOthUEOMCvEpaBM7eBOiAk6NuZ6GrQm25cKPjSYtR9GmR1_sQGtxZsKeHirkSyDhuZxsnWhrmG6jwUA-11Du8k176tkvK5S5goFfvLRZz-EgL6jqV-s2A8pfEKzBp2S2Zom"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/85 to-transparent flex flex-col justify-center p-10">
              <span className="inline-flex items-center px-3 py-1 bg-surface-container-low text-primary text-[10px] font-black uppercase tracking-widest rounded-full mb-4 w-fit">
                VERSION 2.4 - ENHANCED DIAGNOSTICS
              </span>
              <h3 className="font-display text-3xl font-black text-white mb-2">Precision Diagnostics for Every Leaf</h3>
              <p className="text-white/80 max-w-lg text-sm">
                Upload photos of affected crop leaves. Our neural networks analyze cellular patterns to detect over 400 pests and diseases.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-8">
            {/* Left Column: Image upload & parameters */}
            <div className="col-span-12 lg:col-span-8 space-y-8">
              
              {/* Image Uploader */}
              <ErrorBoundary>
                <section className="glass-card rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined">add_a_photo</span>
                      </div>
                      <div>
                        <h4 className="font-headline text-lg font-bold text-primary">Upload Crop Images</h4>
                        <p className="text-sm text-on-surface-variant">Provide clear photos of affected areas.</p>
                      </div>
                    </div>
                    <span className="text-xs text-on-surface-variant bg-surface-container px-3 py-1.5 rounded-full uppercase font-bold tracking-wider">
                      Up to 5 Photos
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {/* Selected Image Previews */}
                    {selectedImages.map((img, idx) => (
                      <div key={idx} className="aspect-square rounded-2xl overflow-hidden relative border border-outline-variant group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={img.preview} 
                          alt="Crop detail" 
                          className="w-full h-full object-cover" 
                        />
                        <button 
                          onClick={() => removeImage(idx)}
                          className="absolute top-2 right-2 w-6 h-6 bg-error hover:bg-error-alert text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </div>
                    ))}

                    {/* Upload Placeholder */}
                    {selectedImages.length < 5 && (
                      <label className="aspect-square rounded-2xl border-2 border-dashed border-outline-variant hover:border-primary transition-colors flex flex-col items-center justify-center cursor-pointer group bg-surface-container-lowest">
                        <input 
                          type="file" 
                          accept="image/*" 
                          multiple 
                          className="hidden" 
                          onChange={handleImageUpload} 
                        />
                        <span className="material-symbols-outlined text-outline-variant group-hover:text-primary mb-2 transition-colors text-3xl">
                          cloud_upload
                        </span>
                        <p className="text-[10px] font-bold text-outline-variant group-hover:text-primary text-center px-4 uppercase tracking-wider">
                          Upload Photo
                        </p>
                      </label>
                    )}
                  </div>
                </section>
              </ErrorBoundary>

              {/* Parameters & Context inputs */}
              <ErrorBoundary>
                <section className="glass-card rounded-[2.5rem] p-10 shadow-sm">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">description</span>
                    </div>
                    <div>
                      <h4 className="font-headline text-lg font-bold text-primary">Additional Details</h4>
                      <p className="text-sm text-on-surface-variant">Identify crop type and symptoms to improve analysis accuracy.</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Select Crop Type</label>
                      <div className="flex flex-wrap gap-2.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar p-1">
                        {Object.values(CROP_ASSETS).map((cropObj) => {
                          const simpleName = cropObj.name.split(' (')[0];
                          const isSelected = cropHint.toLowerCase() === cropObj.name.toLowerCase() || 
                                             cropHint.toLowerCase() === simpleName.toLowerCase() ||
                                             (cropObj.id === 'tomatoes' && cropHint.toLowerCase() === 'tomato') ||
                                             (cropObj.id === 'tomatoes' && cropHint.toLowerCase() === 'tomatoes') ||
                                             (cropObj.id === 'chillies' && cropHint.toLowerCase() === 'chilli') ||
                                             (cropObj.id === 'chillies' && cropHint.toLowerCase() === 'chillies');
                          return (
                            <button
                              key={cropObj.id}
                              type="button"
                              onClick={() => setCropHint(cropObj.name)}
                              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                                isSelected
                                  ? 'bg-primary text-white border-primary shadow-md scale-[1.02]'
                                  : 'bg-white text-on-surface-variant border-outline-variant hover:bg-surface-container'
                              }`}
                            >
                              {simpleName}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="relative group">
                      <textarea 
                        className="w-full bg-white border border-outline-variant rounded-2xl p-5 text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary focus:outline-none transition-all placeholder:text-outline/80" 
                        placeholder="Describe symptoms (e.g. 'Yellowing spots on lower leaves starting 3 days ago...')"
                        rows="3"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                      <button 
                        onClick={toggleRecording}
                        className={`absolute right-4 bottom-4 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          isRecording 
                            ? 'bg-error text-white animate-pulse' 
                            : 'bg-primary text-white hover:shadow-lg hover:shadow-primary/20'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {isRecording ? 'settings_voice' : 'mic'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end">
                    <button 
                      onClick={startAnalysis}
                      disabled={isAnalyzing}
                      className="px-8 py-4 bg-primary text-white rounded-2xl font-black text-sm hover:shadow-xl hover:shadow-primary/25 transition-all flex items-center gap-3 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-[18px]">analytics</span>
                      Run AI Diagnosis
                    </button>
                  </div>
                </section>
              </ErrorBoundary>

            </div>

            {/* Right Column: Status / Results / History */}
            <div className="col-span-12 lg:col-span-4 space-y-8">
              
              {/* Dynamic Status / Result view */}
              <ErrorBoundary>
                <div className="relative">
                  {/* Idle/Initial State */}
                  {!isAnalyzing && !result && (
                    <section className="glass-card rounded-[2.5rem] p-10 text-center min-h-[420px] flex flex-col justify-center items-center bg-gradient-to-br from-surface-container-low/40 to-white shadow-sm border border-outline-variant">
                      <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
                        <span className="material-symbols-outlined text-3xl">center_focus_strong</span>
                      </div>
                      <h5 className="font-headline text-lg font-bold text-primary mb-2">Diagnostic Scan Console</h5>
                      <p className="text-sm text-on-surface-variant max-w-[240px] leading-relaxed">
                        Upload leaf images and press 'Run AI Diagnosis' to identify plant pathogens in seconds.
                      </p>
                    </section>
                  )}

                  {/* Progress Loader state */}
                  {isAnalyzing && (
                    <section className="glass-card rounded-[2.5rem] p-10 text-center min-h-[420px] flex flex-col justify-center items-center shadow-sm">
                      <div className="relative w-36 h-36 mb-8">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle className="text-surface-container" cx="72" cy="72" fill="transparent" r="66" stroke="currentColor" strokeWidth="8" />
                          <circle 
                            className="text-primary transition-all duration-300 ease-out" 
                            cx="72" cy="72" fill="transparent" r="66" 
                            stroke="currentColor" strokeDasharray="414" 
                            strokeDashoffset={414 - (414 * progress) / 100} 
                            strokeWidth="8" 
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="font-display text-3xl font-black text-primary">{progress}%</span>
                        </div>
                      </div>
                      <h5 className="font-headline text-lg font-bold text-primary mb-2">Analyzing Leaf Patterns</h5>
                      <div className="w-full space-y-3 px-4">
                        <div className="shimmer-bg h-2 rounded-full w-full bg-surface-container" />
                        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider font-label" id="status-text">
                          {statusText}
                        </p>
                      </div>
                    </section>
                  )}

                  {/* Analysis Diagnostic Results */}
                  {!isAnalyzing && result && (
                    <section className="glass-card rounded-[2.5rem] p-8 shadow-sm flex flex-col bg-gradient-to-br from-surface-container-low/20 to-white border border-outline-variant space-y-6">
                      
                      {/* Diagnostic Score Card */}
                      <div className="flex items-center justify-between pb-4 border-b border-outline-variant/40">
                        <div>
                          <h5 className="font-headline text-lg font-bold text-primary">{result.crop_name} Diagnosis</h5>
                          <span className="text-[10px] font-black tracking-widest text-secondary uppercase font-label">
                            Analysis Complete
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1 bg-white border border-outline-variant/60 px-4 py-2 rounded-2xl shadow-sm">
                          <span className="text-3xl font-black text-error">{result.health_score}</span>
                          <span className="text-xs text-on-surface-variant font-medium">/100</span>
                        </div>
                      </div>

                      {/* Pathogen Detail */}
                      <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/50">
                        <p className="text-[10px] font-black tracking-wider uppercase text-on-surface-variant/70 mb-1 font-label">
                          Primary Identification
                        </p>
                        <div className="flex items-start gap-3">
                          <span className="material-symbols-outlined text-error text-2xl mt-0.5">coronavirus</span>
                          <div>
                            <p className="font-bold text-primary text-base">{result.diagnosis}</p>
                            {result.scientific_name && (
                              <p className="text-xs text-secondary italic">{result.scientific_name}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-4 flex items-center justify-between text-xs font-bold">
                          <span className="text-on-surface-variant">Confidence Level</span>
                          <span className="text-primary font-bold">{(result.confidence * 100).toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-surface-container rounded-full mt-2 overflow-hidden">
                          <div 
                            className="h-full bg-tertiary rounded-full" 
                            style={{ width: `${result.confidence * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Remedies */}
                      <div className="space-y-3">
                        <p className="text-[10px] font-black tracking-wider uppercase text-on-surface-variant/70 font-label">
                          Treatment Suggestions
                        </p>
                        <ul className="space-y-3">
                          {result.remedies.map((tip, idx) => (
                            <li key={idx} className="flex gap-2.5 text-sm text-on-surface">
                              <span className="material-symbols-outlined text-tertiary text-[18px] shrink-0">
                                check_circle
                              </span>
                              <span className="leading-tight">{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Diagnostic Buttons */}
                      <div className="pt-4 flex flex-col gap-3">
                        <button 
                          onClick={exportReportToPDF}
                          className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:shadow-lg hover:shadow-primary/20 text-sm transition-all flex items-center justify-center gap-2"
                        >
                          <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                          Export Full Report (PDF)
                        </button>
                        <button 
                          onClick={() => setResult(null)}
                          className="w-full py-2.5 border border-outline-variant text-on-surface-variant rounded-xl text-sm font-semibold hover:bg-surface-container transition-all"
                        >
                          Scan Another Leaf
                        </button>
                      </div>
                    </section>
                  )}
                </div>
              </ErrorBoundary>

              {/* Diagnostic History List */}
              <ErrorBoundary>
                <section className="glass-card rounded-[2.5rem] p-6 shadow-sm border border-outline-variant">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="material-symbols-outlined text-primary text-xl">history</span>
                    <h5 className="font-headline font-bold text-primary">Recent Scans</h5>
                  </div>

                  {history.length === 0 ? (
                    <p className="text-xs text-on-surface-variant/70 italic text-center py-6">
                      No previous scans in history.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {history.map((scan) => (
                        <div 
                          key={scan.id}
                          className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 hover:bg-surface-container transition-colors cursor-pointer group"
                          onClick={() => setResult(scan)}
                        >
                          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                            <FallbackImage 
                              src={scan.image_url} 
                              alt={scan.crop_name} 
                              className="w-full h-full object-cover" 
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h6 className="font-bold text-xs text-primary truncate">
                              {scan.crop_name} - {scan.diagnosis}
                            </h6>
                            <p className="text-[10px] text-on-surface-variant/80 mt-0.5">
                              {new Date(scan.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors text-base">
                            chevron_right
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </ErrorBoundary>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
