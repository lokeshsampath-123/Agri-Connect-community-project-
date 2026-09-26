'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import FallbackImage from '@/components/FallbackImage';
import ErrorBoundary from '@/components/ErrorBoundary';
import { supabase } from '@/lib/supabase';
import { CROP_ASSETS } from '@/lib/assets';
import html2canvas from 'html2canvas-pro';

const CROP_SPELLCHECK = {
  'padi': 'Paddy',
  'pady': 'Paddy',
  'paddy': 'Paddy',
  'rice': 'Paddy',
  'coton': 'Cotton',
  'coto': 'Cotton',
  'cotton': 'Cotton',
  'chili': 'Chillies',
  'chilly': 'Chillies',
  'chillies': 'Chillies',
  'tomat': 'Tomatoes',
  'tomato': 'Tomatoes',
  'tomatoes': 'Tomatoes',
  'sugarcane': 'Sugarcane',
  'sugar cane': 'Sugarcane',
  'sugarc': 'Sugarcane',
  'maiz': 'Maize',
  'maize': 'Maize',
  'corn': 'Maize',
  'mango': 'Mangoes',
  'mang': 'Mangoes',
  'mangoes': 'Mangoes',
  'cashew': 'Cashews',
  'cashews': 'Cashews',
  'turmeric': 'Turmeric',
  'turmerik': 'Turmeric',
  'groundnut': 'Groundnut',
  'groundnuts': 'Groundnut',
  'peanut': 'Groundnut',
  'bengal gram': 'Bengal Gram',
  'bengalgram': 'Bengal Gram',
  'tobaco': 'Tobacco',
  'tobacco': 'Tobacco',
  'onion': 'Onions',
  'onions': 'Onions',
  'sunflower': 'Sunflower',
  'sun flowr': 'Sunflower',
  'black gram': 'Black Gram',
  'blackgram': 'Black Gram',
  'green gram': 'Green Gram',
  'greengram': 'Green Gram'
};

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
  const [userProfile, setUserProfile] = useState(null);
  const [customCropInput, setCustomCropInput] = useState('');
  const [spellingFeedback, setSpellingFeedback] = useState('');
  const [isOtherCropMode, setIsOtherCropMode] = useState(false);
  const [pdfLanguage, setPdfLanguage] = useState('en');
  const [showFullReportModal, setShowFullReportModal] = useState(false);

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
      setUserProfile(prof);
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
      const activeLang = localStorage.getItem('agri_lang') || 'en';
      setPdfLanguage(activeLang);
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

  const handleCustomCropChange = (e) => {
    setCustomCropInput(e.target.value);
  };

  const handleCustomCropBlur = () => {
    const val = customCropInput.trim();
    if (!val) return;
    
    const normalized = val.toLowerCase();
    const corrected = CROP_SPELLCHECK[normalized] || (val.charAt(0).toUpperCase() + val.slice(1));
    
    setCropHint(corrected);
    setCustomCropInput(corrected);
    
    if (corrected.toLowerCase() !== val.toLowerCase()) {
      setSpellingFeedback(`Corrected spelling to: ${corrected}`);
      setTimeout(() => setSpellingFeedback(''), 5000);
    } else {
      setSpellingFeedback(`Custom crop: ${corrected}`);
      setTimeout(() => setSpellingFeedback(''), 3000);
    }
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
        
        // --- TRANSLATION AND TRANSLITERATION DICTIONARY FOR PDF ---
        const lang = pdfLanguage;
        const isTe = lang === 'te';
        const isHi = lang === 'hi';
        
        // Use transliterated/English equivalents to prevent jsPDF PDF font rendering glitches (e.g. ???)
        const tGov = isTe ? "ANDHRA PRADESH PRABHUTVAM (GOVT OF AP)" : isHi ? "ANDHRA PRADESH SARKAR (GOVT OF AP)" : "GOVERNMENT OF ANDHRA PRADESH";
        const tDept = isTe ? "VYAVASAYA & UDYANAVANA VIBHAGAM (AGRI DEPT)" : isHi ? "KRISHI EVAM HORTICULTURE VIBHAG" : "DEPARTMENT OF AGRICULTURE & HORTICULTURE";
        const tPortal = isTe ? "FarmWise Portal | Rythu Precision Farming" : isHi ? "FarmWise Portal | Precision Farming" : "Verdant Precision Farming Initiative | FarmWise Portal";
        const tTitle = isTe ? "PANTA AROGYA NIRDHARANA NIVEDIKA" : isHi ? "FASAL SWASTHYA NIDAN REPORT" : "PRECISION CROP DIAGNOSTIC REPORT";
        
        const labelCrop = isTe ? "Panta Rakam (Crop Inspected):" : isHi ? "Fasal Ka Prakar (Crop Inspected):" : "Crop Inspected:";
        const labelDate = isTe ? "Scan Samayam (Date/Time):" : isHi ? "Scan Samay (Date/Time):" : "Scan Date/Time:";
        const labelRegion = isTe ? "Prantham (Region):" : isHi ? "Prant (Region):" : "Farmer Region:";
        
        const labelMetrics = isTe ? "1. AROGYA VALUE (HEALTH METRICS)" : isHi ? "1. SWASTHYA METRICS (HEALTH METRICS)" : "1. HEALTH METRICS";
        const labelIndex = isTe ? "Plant Health Index (PHI):" : isHi ? "Plant Health Index (PHI):" : "Plant Health Index (PHI):";
        const labelStatus = isTe ? "Sthithi (Health Status):" : isHi ? "Sthiti (Health Status):" : "Status:";
        const labelConf = isTe ? "Arogya Nammakam (Neural Confidence):" : isHi ? "Arogya Vishwas (Neural Confidence):" : "Confidence level of neural identification:";
        
        const labelPath = isTe ? "2. ROGA NIRDHARANA (PATHOLOGY / PEST DIAGNOSIS)" : isHi ? "2. ROG NIDAN (PATHOLOGY / PEST DIAGNOSIS)" : "2. PATHOLOGY / PEST IDENTIFICATION";
        const labelSci = isTe ? "Shastriya Namam (Scientific Name):" : isHi ? "Vaigyanik Naam (Scientific Name):" : "Scientific Name:";
        const labelDiag = isTe ? "AI Roga Nirdharanam (AI Diagnosis):" : isHi ? "AI Rog Nidan (AI Diagnosis):" : "AI Diagnosis:";
        
        const labelObservations = isTe ? "3. LAKSHANALU & FIELD OBSERVATIONS" : isHi ? "3. LAKSHAN & FIELD OBSERVATIONS" : "3. FIELD OBSERVATIONS & SYMPTOMS";
        const labelRemedies = isTe ? "4. NIVARANA CHARYALU (RECOMMENDED REMEDIES)" : isHi ? "4. UPCHAR & RECOMMENDED ACTION PLAN" : "4. RECOMMENDED ACTION PLAN";
        
        const textHealthy = isTe ? "Arogyamga Undhi (Healthy)" : isHi ? "Swasth Hai (Healthy)" : "Healthy";
        const textCritical = isTe ? "Teevramaina Infestation (Critical)" : isHi ? "Gambhira Sankraman (Critical)" : "Critical Infestation";
        const textModerate = isTe ? "Madhyamanga Undhi (Moderate Damage)" : isHi ? "Madhyam Nuksan (Moderate Damage)" : "Moderate Damage";
        
        const disclaimer = isTe 
          ? "Disclaimer: Idhi visual lakshanalanu batti generated AI analysis. Rythulu chemical pesticide vade mundhu local Rythu Bharosa Kendra (RBK) officer ni sampradinchali."
          : isHi
          ? "Disclaimer: Yeh visual lakshano ke aadhar par generated AI analysis hai. Kisan chemical pesticide prayog karne se pehle local Rythu Bharosa Kendra (RBK) officer se salah le."
          : "Disclaimer: This is an AI-assisted diagnostic report generated by the FarmWise Precision farming engine based on visual symptom analysis. Farmers are advised to consult their local Rythu Bharosa Kendra (RBK) agricultural officer before executing heavy chemical pesticide applications.";
        
        // Helper to strip non-Latin characters from strings for downloaded PDF to prevent jsPDF Helvetica rendering crashes (???)
        const cleanForPDF = (str) => {
          if (!str) return '';
          return str.replace(/[^\x00-\x7F]/g, "").trim().replace(/\s+/g, " ");
        };
        
        const activeTranslationsObj = result.translations?.[lang];
        
        const displayCropPDF = activeTranslationsObj?.crop_name ? cleanForPDF(activeTranslationsObj.crop_name) : '';
        const displayDiagPDF = activeTranslationsObj?.diagnosis ? cleanForPDF(activeTranslationsObj.diagnosis) : '';
        const displaySymptomsPDF = activeTranslationsObj?.symptoms ? cleanForPDF(activeTranslationsObj.symptoms) : '';
        const displayRemediesPDF = activeTranslationsObj?.remedies ? activeTranslationsObj.remedies.map(r => cleanForPDF(r)).filter(Boolean) : [];
        
        const cropNameValue = displayCropPDF || result.crop_name;
        const diagnosisValue = displayDiagPDF || result.diagnosis;
        const symptomsValue = displaySymptomsPDF || result.symptoms;
        const remediesValue = displayRemediesPDF.length > 0 ? displayRemediesPDF : result.remedies || [];

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
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(tGov, 40, 18);
        doc.setFontSize(11);
        doc.setTextColor(16, 107, 60);
        doc.text(tDept, 40, 24);
        doc.setFontSize(7.5);
        doc.setTextColor(130, 130, 130);
        doc.text(tPortal, 40, 29);
        
        doc.setDrawColor(16, 107, 60);
        doc.setLineWidth(1);
        doc.line(10, 37, pageWidth - 10, 37);
        
        // --- REPORT TITLE ---
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(30, 30, 30);
        doc.text(tTitle, 10, 47);
        
        doc.setFillColor(240, 245, 241);
        doc.rect(10, 52, pageWidth - 20, 18, 'F');
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(80, 80, 80);
        
        const scanDate = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        doc.text(`${labelDate} ${scanDate}`, 12, 57);
        doc.text(`${labelRegion} ${userDistrict} District, AP`, 12, 62);
        
        doc.text(`${labelCrop} ${cropNameValue}`, pageWidth / 2 + 5, 57);
        doc.text(`Diagnostic Code: FW-SCAN-${Math.floor(100000 + Math.random() * 900000)}`, pageWidth / 2 + 5, 62);
        
        // --- SEVERITY & HEALTH INDEX SECTION ---
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(16, 107, 60);
        doc.text(labelMetrics, 10, 80);
        
        const score = result.health_score;
        let ratingText = textHealthy;
        let ratingColor = [16, 107, 60]; 
        
        if (score < 50) {
          ratingText = textCritical;
          ratingColor = [198, 40, 40]; 
        } else if (score < 80) {
          ratingText = textModerate;
          ratingColor = [230, 120, 0]; 
        }
        
        doc.setFillColor(245, 248, 246);
        doc.rect(10, 84, pageWidth - 20, 24, 'F');
        doc.setDrawColor(ratingColor[0], ratingColor[1], ratingColor[2]);
        doc.setLineWidth(0.8);
        doc.rect(10, 84, pageWidth - 20, 24, 'S');
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(60, 60, 60);
        doc.text(labelIndex, 15, 93);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.setTextColor(ratingColor[0], ratingColor[1], ratingColor[2]);
        doc.text(`${score}`, 15, 103);
        doc.setFontSize(10);
        doc.setTextColor(120, 120, 120);
        doc.text("/ 100", 27, 103);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(50, 50, 50);
        doc.text(`${labelStatus} ${ratingText}`, 70, 93);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(80, 80, 80);
        doc.text(`${labelConf} ${(result.confidence * 100).toFixed(1)}%`, 70, 99);
        
        doc.setFillColor(220, 220, 220);
        doc.rect(70, 101, 80, 3, 'F');
        doc.setFillColor(ratingColor[0], ratingColor[1], ratingColor[2]);
        doc.rect(70, 101, 80 * result.confidence, 3, 'F');
        
        // --- PRIMARY DIAGNOSIS ---
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(16, 107, 60);
        doc.text(labelPath, 10, 118);
        
        doc.setFillColor(245, 248, 246);
        doc.rect(10, 122, pageWidth - 20, 22, 'F');
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11.5);
        doc.setTextColor(accentRed[0], accentRed[1], accentRed[2]);
        doc.text(`${labelDiag} ${diagnosisValue}`, 15, 131);
        
        if (result.scientific_name && result.scientific_name !== 'N/A') {
          doc.setFont("helvetica", "italic");
          doc.setFontSize(8.5);
          doc.setTextColor(100, 100, 100);
          doc.text(`${labelSci} ${result.scientific_name}`, 15, 137);
        }
        
        // --- SYMPTOMS ---
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(16, 107, 60);
        doc.text(labelObservations, 10, 150);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        
        const splitSymptoms = doc.splitTextToSize(symptomsValue || "Lesions or leaf anomalies noted on structure. Minor cell degradation observed.", pageWidth - 30);
        doc.text(splitSymptoms, 15, 156);
        
        const symptomLinesCount = splitSymptoms.length;
        const remediesY = 156 + (symptomLinesCount * 5) + 6;
        
        // --- AGRONOMICAL REMEDIES ---
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(16, 107, 60);
        doc.text(labelRemedies, 10, remediesY);
        
        let remY = remediesY + 6;
        remediesValue.forEach((rem, idx) => {
          doc.setFillColor(16, 107, 60);
          doc.circle(16, remY - 1.2, 0.8, 'F'); 
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
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
        doc.setFontSize(7);
        doc.setTextColor(140, 140, 140);
        const splitDisclaimer = doc.splitTextToSize(disclaimer, pageWidth - 20);
        doc.text(splitDisclaimer, 10, pageHeight - 20);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(16, 107, 60);
        doc.text("FarmWise - Empowering Andhra Pradesh Farmers", 10, pageHeight - 10);
        doc.text("Rythu Bharosa Support: 1902", pageWidth - 55, pageHeight - 10);
        
        const sanitizedCrop = result.crop_name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        doc.save(`FarmWise_Report_${sanitizedCrop}_${Date.now()}.pdf`);
        
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
      document.head.appendChild(script);
    } else {
      generate();
    }
  };

  const printReportCard = () => {
    if (!result) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups to print the report card.");
      return;
    }
    
    const lang = pdfLanguage;
    const isTe = lang === 'te';
    const isHi = lang === 'hi';
    
    const tTitle = isTe ? "పంట ఆరోగ్య నిర్ధారణ నివేదిక" : isHi ? "फसल स्वास्थ्य निदान रिपोर्ट" : "PRECISION CROP DIAGNOSTIC REPORT";
    const tGov = isTe ? "ఆంధ్రప్రదేశ్ ప్రభుత్వం" : isHi ? "आंध्र प्रदेश सरकार" : "GOVERNMENT OF ANDHRA PRADESH";
    const tDept = isTe ? "వ్యవసాయ & ఉద్యానవన శాఖ" : isHi ? "कृषि एवं बागवानी विभाग" : "DEPARTMENT OF AGRICULTURE & HORTICULTURE";
    const tSubtitle = isTe ? "వర్దెంట్ ఖచ్చితమైన వ్యవసాయ చొరవ | ఫార్మ్‌వైస్ పోర్టల్" : isHi ? "वर्डेंट प्रेसिजन फार्मिंग इनिशिएटिव | फार्मवाइज़ पोर्टल" : "Verdant Precision Farming Initiative | FarmWise Portal";
    
    const tCrop = isTe ? "పంట రకం" : isHi ? "फसल का प्रकार" : "Crop Type";
    const tDiag = isTe ? "ఎఐ వ్యాధి నిర్ధారణ" : isHi ? "एआई रोग निदान" : "AI Diagnosis";
    const tConf = isTe ? "నమ్మక స్థాయి" : isHi ? "विश्वास स्तर" : "Neural Confidence";
    const tScore = isTe ? "ఆరోగ్య స్కోరు" : isHi ? "स्वास्थ्य स्कोर" : "Plant Health Index";
    const tSymptoms = isTe ? "లక్షణాల విశ్లేషణ" : isHi ? "लक्षणों का विश्लेषण" : "Symptom Analysis";
    const tRemedies = isTe ? "సిఫార్సు చేయబడిన నివారణలు" : isHi ? "अनुशंसित उपचार" : "Recommended Remedies";
    const tSupport = isTe ? "రైతు భరోసా మద్దతు" : isHi ? "रैतु भरोसा समर्थन" : "Rythu Bharosa Support";
    
    const activeTranslations = result.translations?.[lang];
    const displayCrop = activeTranslations?.crop_name || (isTe ? `${result.crop_name} (పంట)` : isHi ? `${result.crop_name} (फसल)` : result.crop_name);
    const displayDiag = activeTranslations?.diagnosis || (isTe ? `${result.diagnosis} (నిర్ధారణ)` : isHi ? `${result.diagnosis} (निदान)` : result.diagnosis);
    const displaySymptoms = activeTranslations?.symptoms || result.symptoms;
    const displayRemedies = activeTranslations?.remedies || result.remedies;
    
    const contentHtml = `
      <html>
        <head>
          <title>FarmWise Report - ${result.crop_name}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; padding: 20px; line-height: 1.6; background-color: #f7faf8; }
            .certificate-border { border: 4px double #166b3c; padding: 35px; border-radius: 18px; max-width: 800px; margin: 20px auto; background: #fff; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
            .header-block { text-align: center; border-bottom: 2.5px solid #166b3c; padding-bottom: 20px; margin-bottom: 25px; }
            .gov-text { font-size: 12px; font-weight: 800; color: #555; margin: 0; letter-spacing: 1.5px; text-transform: uppercase; }
            .dept-text { font-size: 18px; font-weight: 900; color: #166b3c; margin: 6px 0 0 0; }
            .sub-text { font-size: 10px; color: #777; margin: 6px 0 0 0; font-weight: 600; }
            .report-title { font-size: 20px; font-weight: 900; text-align: center; color: #222; margin: 25px 0; letter-spacing: 0.5px; text-transform: uppercase; }
            .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-bottom: 30px; background: #f4f8f5; padding: 20px; border-radius: 12px; border: 1px solid #d5e4db; }
            .grid-item { font-size: 14px; font-weight: 700; color: #2e4a3b; }
            .label { color: #5c7567; font-size: 11px; text-transform: uppercase; display: block; margin-bottom: 4px; font-weight: 800; }
            .health-section { border: 1.5px solid #166b3c; background: #f9fbf9; border-radius: 12px; padding: 20px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 30px; }
            .health-score { font-size: 36px; font-weight: 900; color: #166b3c; }
            .health-text { margin-left: 20px; }
            .section-title { font-size: 15px; font-weight: 900; color: #166b3c; margin-bottom: 12px; border-bottom: 1.5px dashed #c0d8c2; padding-bottom: 6px; text-transform: uppercase; }
            .observation-box { background: #fafdfb; padding: 18px; border-radius: 12px; border: 1px solid #d5e4db; margin-bottom: 30px; font-size: 14px; font-weight: 500; color: #2c3e35; }
            .remedy-item { margin-bottom: 10px; font-size: 14px; font-weight: 600; color: #2c3e35; }
            .disclaimer { font-size: 10px; color: #888; text-align: center; margin-top: 40px; border-top: 1px solid #e5ebe7; padding-top: 20px; line-height: 1.5; font-style: italic; }
            .support-footer { display: flex; justify-content: space-between; font-size: 12px; font-weight: 800; color: #166b3c; margin-top: 25px; border-top: 1px solid #e5ebe7; padding-top: 15px; }
            @media print {
              body { padding: 0; background: none; }
              .certificate-border { border: none; padding: 0; margin: 0; box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="certificate-border">
            <div class="header-block">
              <p class="gov-text">${tGov}</p>
              <h1 class="dept-text">${tDept}</h1>
              <p class="sub-text">${tSubtitle}</p>
            </div>
            
            <h2 class="report-title">${tTitle}</h2>
            
            <div class="grid">
              <div class="grid-item">
                <span class="label">${tCrop}</span>
                ${displayCrop}
              </div>
              <div class="grid-item">
                <span class="label">Diagnostic Code</span>
                FW-SCAN-${Math.floor(100000 + Math.random() * 900000)}
              </div>
              <div class="grid-item">
                <span class="label">Date / Time</span>
                ${new Date().toLocaleString(lang === 'en' ? 'en-IN' : lang === 'te' ? 'te-IN' : 'hi-IN', { timeZone: 'Asia/Kolkata' })}
              </div>
              <div class="grid-item">
                <span class="label">Farmer Region</span>
                ${userDistrict} District, Andhra Pradesh
              </div>
            </div>
            
            <div class="section-title">${tScore}</div>
            <div class="health-section">
              <div class="health-score">${result.health_score} <span style="font-size: 16px; color: #888;">/ 100</span></div>
              <div class="health-text">
                <span class="label" style="margin:0;">Status Rating</span>
                <strong style="color: ${result.health_score < 50 ? '#c62828' : '#166b3c'}; font-size: 15px;">
                  ${result.health_score < 50 
                    ? (isTe ? "తీవ్రమైన నష్టం (Critical Infestation)" : isHi ? "गंभीर संक्रमण (Critical)" : "Critical infestation") 
                    : (isTe ? "ఆరోగ్యకరం (Healthy)" : isHi ? "स्वस्थ (Healthy)" : "Healthy")}
                </strong>
              </div>
            </div>
            
            <div class="section-title">${tDiag}</div>
            <div class="observation-box" style="font-size: 16px; font-weight: 800; color: #c62828; border-left: 5px solid #c62828; background: #fffdfd;">
              ${displayDiag}
              <div style="font-size: 12px; font-weight: 600; color: #666; margin-top: 6px;">
                ${tConf}: ${(result.confidence * 100).toFixed(1)}%
              </div>
            </div>
            
            <div class="section-title">${tSymptoms}</div>
            <div class="observation-box">
              ${displaySymptoms}
            </div>
            
            <div class="section-title">${tRemedies}</div>
            <div class="observation-box" style="background: #fff; border: 1.5px solid #166b3c; border-left: 5px solid #166b3c;">
              <ul style="margin: 0; padding-left: 20px;">
                ${displayRemedies.map(r => `<li class="remedy-item">${r}</li>`).join('')}
              </ul>
            </div>
            
            <div class="disclaimer">
              ${isTe 
                ? "నిరాకరణ: ఇది విజువల్ లక్షణాల విశ్లేషణ ఆధారంగా ఫార్మ్‌వైస్ ప్రెసిషన్ ఫార్మింగ్ ఇంజిన్ ద్వారా రూపొందించబడిన AI-సహాయక విశ్లేషణ నివేదిక. రైతులు భారీ రసాయన పురుగుమందులను ఉపయోగించే ముందు స్థానిక రైతు భరోసా కేంద్రం (RBK) వ్యవసాయ అధికారిని సంప్రదించవలసిందిగా కోరడమైనది." 
                : isHi 
                ? "अस्वीकरण: यह विज़ुअल लक्षण विश्लेषण के आधार पर फार्मवाइज़ प्रिसिजन फार्मिंग इंजन द्वारा उत्पन्न एक एआई-सहायता प्राप्त निदान रिपोर्ट है। किसानों को सलाह दी जाती है कि वे भारी रासायनिक कीटनाशकों का उपयोग करने से पहले अपने स्थानीय रैतु भरोसा केंद्र (आरबीके) कृषि अधिकारी से परामर्श लें।" 
                : "Disclaimer: This is an AI-assisted diagnostic report generated by the FarmWise Precision farming engine based on visual symptom analysis. Farmers are advised to consult their local Rythu Bharosa Kendra (RBK) agricultural officer before executing heavy chemical pesticide applications."}
            </div>
            
            <div class="support-footer">
              <div>FarmWise - Digital Agriculture initiative</div>
              <div>${tSupport}: 1902</div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(contentHtml);
    printWindow.document.close();
  };

  const takeScreenshot = () => {
    const element = document.getElementById('print-report-card-capture');
    if (!element) return;
    
    html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false
    }).then((canvas) => {
      const link = document.createElement('a');
      link.download = `FarmWise_Report_${result?.crop_name?.toLowerCase() || 'crop'}_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }).catch((err) => {
      console.error("Screenshot capture failed:", err);
      alert("Failed to capture screenshot: " + err.message);
    });
  };

  const toggleRecording = () => {
    if (isRecording) {
      if (window._recognition) {
        window._recognition.stop();
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in your browser. Please try Chrome, Edge, or Safari.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      
      const activeLang = localStorage.getItem('agri_lang') || 'en';
      recognition.lang = activeLang === 'te' ? 'te-IN' : activeLang === 'hi' ? 'hi-IN' : 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setDescription((prev) => prev ? prev + ' ' + transcript : transcript);
      };

      window._recognition = recognition;
      recognition.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setIsRecording(false);
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
              {userProfile && userProfile.profileImage ? (
                <img 
                  src={userProfile.profileImage} 
                  alt="Farmer Profile" 
                  className="w-8 h-8 rounded-full object-cover border border-outline-variant shadow-sm"
                />
              ) : (
                <div className="w-8 h-8 rounded-full border border-outline-variant shadow-sm overflow-hidden bg-surface-container flex items-center justify-center font-bold text-primary">
                  <span className="material-symbols-outlined text-lg">account_circle</span>
                </div>
              )}
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
                          const isSelected = !isOtherCropMode && (
                                             cropHint.toLowerCase() === cropObj.name.toLowerCase() || 
                                             cropHint.toLowerCase() === simpleName.toLowerCase() ||
                                             (cropObj.id === 'tomatoes' && cropHint.toLowerCase() === 'tomato') ||
                                             (cropObj.id === 'tomatoes' && cropHint.toLowerCase() === 'tomatoes') ||
                                             (cropObj.id === 'chillies' && cropHint.toLowerCase() === 'chilli') ||
                                             (cropObj.id === 'chillies' && cropHint.toLowerCase() === 'chillies'));
                          return (
                            <button
                              key={cropObj.id}
                              type="button"
                              onClick={() => {
                                setCropHint(cropObj.name);
                                setIsOtherCropMode(false);
                                setSpellingFeedback('');
                              }}
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
                        <button
                          type="button"
                          onClick={() => {
                            setIsOtherCropMode(true);
                            if (customCropInput) {
                              setCropHint(customCropInput);
                            } else {
                              setCropHint('Custom Crop');
                            }
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                            isOtherCropMode
                              ? 'bg-primary text-white border-primary shadow-md scale-[1.02]'
                              : 'bg-white text-on-surface-variant border-outline-variant hover:bg-surface-container'
                          }`}
                        >
                          Other Crop...
                        </button>
                      </div>
                      
                      {isOtherCropMode && (
                        <div className="mt-4 space-y-2 bg-surface-container/30 p-4 rounded-2xl border border-outline-variant/45">
                          <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                            Type Custom Crop Name
                          </label>
                          <input 
                            type="text"
                            value={customCropInput}
                            onChange={handleCustomCropChange}
                            onBlur={handleCustomCropBlur}
                            placeholder="Enter crop name (e.g. Chilli, Cotton, Paddy, Cashews...)"
                            className="w-full bg-white border border-outline-variant rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-primary transition-all"
                          />
                          {spellingFeedback && (
                            <p className="text-[11px] font-bold text-primary flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">done</span>
                              {spellingFeedback}
                            </p>
                          )}
                        </div>
                      )}
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
                      <div className="pt-4 flex flex-col gap-3 bg-surface-container/30 p-4 rounded-2xl border border-outline-variant/40">
                        <div className="space-y-2.5">
                          <button 
                            onClick={() => setShowFullReportModal(true)}
                            className="w-full py-3.5 bg-primary text-white rounded-xl font-bold hover:shadow-lg hover:shadow-primary/20 text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-base">visibility</span>
                            Open PDF Report
                          </button>
                        </div>
                        
                        <button 
                          onClick={() => { setResult(null); setSpellingFeedback(''); }}
                          className="w-full py-2 border border-outline-variant text-on-surface-variant rounded-xl text-xs font-semibold hover:bg-surface-container transition-all mt-1"
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

        {/* Full Report Modal Overlay */}
        {showFullReportModal && result && (() => {
          const activeLang = (typeof window !== 'undefined' ? localStorage.getItem('agri_lang') : 'en') || 'en';
          const isTrans = activeLang !== 'en';
          const fontClass = isTrans ? 'text-xs sm:text-sm' : 'text-sm sm:text-base';
          
          return (
            <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-50 flex flex-col items-center justify-start overflow-y-auto p-4 sm:p-6 animate-fade-in">
              {/* Action Bar */}
              <div id="screenshot-actions-bar" className="w-full max-w-[800px] flex items-center justify-between gap-3 p-4 bg-white/95 backdrop-blur-md rounded-t-2xl border-b border-outline-variant/65 shadow-md notranslate sticky top-0 z-10">
                <button 
                  onClick={() => setShowFullReportModal(false)}
                  className="px-4 py-2 border border-outline-variant hover:bg-surface-container text-on-surface-variant font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                  Close
                </button>
                <button 
                  onClick={takeScreenshot}
                  className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-white font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                  Take Screenshot & Share
                </button>
              </div>

              {/* Certificate Container */}
              <div 
                id="print-report-card-capture" 
                className="w-full max-w-[800px] bg-white p-6 sm:p-10 rounded-b-2xl shadow-xl relative border-[6px] border-double border-green-800 text-slate-800"
              >
                {/* Header Block */}
                <div className="text-center border-b-[2.5px] border-green-800 pb-4 mb-6">
                  <p className="text-[10px] sm:text-xs font-black tracking-[1.5px] text-slate-500 uppercase m-0">
                    GOVERNMENT OF ANDHRA PRADESH
                  </p>
                  <h1 className="text-lg sm:text-xl font-black text-green-800 mt-1 mb-1">
                    DEPARTMENT OF AGRICULTURE & HORTICULTURE
                  </h1>
                  <p className="text-[9px] sm:text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    Verdant Precision Farming Initiative | FarmWise Portal
                  </p>
                </div>

                {/* Title */}
                <h2 className="text-base sm:text-lg font-black text-center text-slate-800 mb-6 uppercase tracking-wider">
                  PRECISION CROP DIAGNOSTIC REPORT
                </h2>

                {/* Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 bg-green-50/50 p-4 rounded-xl border border-green-100">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Crop Type</span>
                    <span className="text-sm font-bold text-green-950">{result.crop_name}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Diagnostic Code</span>
                    <span className="text-sm font-mono font-bold text-green-950">
                      FW-SCAN-{result.id ? result.id.toString().slice(0, 6) : '583920'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Scan Date / Time</span>
                    <span className="text-sm font-semibold text-slate-700">
                      {new Date(result.created_at || Date.now()).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Farmer Region</span>
                    <span className="text-sm font-semibold text-slate-700">{userDistrict} District, AP</span>
                  </div>
                </div>

                {/* Health Metrics */}
                <h3 className="text-xs sm:text-sm font-black text-green-800 border-b border-dashed border-green-200 pb-1.5 uppercase tracking-wider mb-3">
                  1. HEALTH METRICS
                </h3>
                <div className="border border-green-700 bg-green-50/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Plant Health Index (PHI)</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-green-800">{result.health_score}</span>
                      <span className="text-xs text-slate-400 font-bold">/ 100</span>
                    </div>
                  </div>
                  <div className="flex-1 max-w-[280px]">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status Rating</span>
                    <strong className={`text-sm font-bold ${result.health_score < 50 ? 'text-red-700' : 'text-green-800'}`}>
                      {result.health_score < 50 ? 'Critical Infestation' : result.health_score < 80 ? 'Moderate Damage' : 'Healthy'}
                    </strong>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${result.health_score < 50 ? 'bg-red-600' : 'bg-green-700'}`}
                        style={{ width: `${result.health_score}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Confidence Level</span>
                    <span className="text-sm font-bold text-slate-700">{(result.confidence * 100).toFixed(1)}%</span>
                  </div>
                </div>

                {/* Diagnosis */}
                <h3 className="text-xs sm:text-sm font-black text-green-800 border-b border-dashed border-green-200 pb-1.5 uppercase tracking-wider mb-3">
                  2. PATHOLOGY / PEST IDENTIFICATION
                </h3>
                <div className="bg-red-50/30 border-l-4 border-red-600 p-4 rounded-r-xl mb-6">
                  <span className="block text-[10px] font-bold text-red-500 uppercase tracking-wider mb-0.5">AI Diagnosis</span>
                  <p className="text-base font-black text-red-800">{result.diagnosis}</p>
                  {result.scientific_name && result.scientific_name !== 'N/A' && (
                    <p className="text-xs italic text-slate-500 mt-1">Scientific Name: {result.scientific_name}</p>
                  )}
                </div>

                {/* Symptoms */}
                <h3 className="text-xs sm:text-sm font-black text-green-800 border-b border-dashed border-green-200 pb-1.5 uppercase tracking-wider mb-3">
                  3. FIELD OBSERVATIONS & SYMPTOMS
                </h3>
                <div className={`bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 text-slate-700 ${fontClass} leading-relaxed`}>
                  {result.symptoms}
                </div>

                {/* Recommended Remedies */}
                <h3 className="text-xs sm:text-sm font-black text-green-800 border-b border-dashed border-green-200 pb-1.5 uppercase tracking-wider mb-3">
                  4. RECOMMENDED ACTION PLAN
                </h3>
                <div className={`border border-green-800/40 p-4 rounded-xl bg-white mb-6 ${fontClass} leading-relaxed`}>
                  <ul className="space-y-2.5">
                    {result.remedies.map((tip, idx) => (
                      <li key={idx} className="flex gap-2.5 text-slate-700">
                        <span className="text-green-800 font-bold shrink-0 text-base">•</span>
                        <span className="leading-tight">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Disclaimer */}
                <div className="text-[9px] sm:text-[10px] text-slate-400 italic text-center border-t border-slate-200 pt-4 mt-8 leading-normal">
                  Disclaimer: This is an AI-assisted diagnostic report generated by the FarmWise Precision farming engine based on visual symptom analysis. Farmers are advised to consult their local Rythu Bharosa Kendra (RBK) agricultural officer before executing heavy chemical pesticide applications.
                </div>

                {/* Sign Off Footer */}
                <div className="flex justify-between items-center text-[10px] sm:text-xs font-black text-green-800 mt-5 border-t border-slate-100 pt-3">
                  <span>FarmWise - Digital Agriculture Initiative</span>
                  <span>Rythu Bharosa Support: 1902</span>
                </div>
              </div>
            </div>
          );
        })()}
      </main>
    </div>
  );
}
