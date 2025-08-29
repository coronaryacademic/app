// === HTML Report Generator ===
export function initHTMLReportGenerator() {
  try {
    console.log('[HTML Report] Initializing HTML report generator');
    
    // No initialization needed - functions are ready to use
    return true;
  } catch (error) {
    console.error('[HTML Report] Initialization failed:', error);
    return false;
  }
}

export function generateHTMLReport(formData, aiContent) {
  const reportDate = new Date().toLocaleString();
  const patientName = formData.patientName || 'Unknown Patient';
  
  // Build the HTML report using ECG report styling
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Clinical History Report for ${patientName}</title>
    
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; 
            line-height: 1.6; 
            color: #212529; 
            background-color: #f8f9fa; 
            margin: 0; 
            padding: 0; 
        }
        .container { 
            max-width: 800px; 
            margin: 20px auto; 
            background-color: #ffffff; 
            border: 1px solid #dee2e6; 
            border-radius: 8px; 
            padding: 40px; 
        }
        .page-break { page-break-after: always; }
        .report-header { 
            text-align: center; 
            border-bottom: 1px solid #e9ecef; 
            padding-bottom: 20px; 
            margin-bottom: 30px; 
        }
        .report-header h1 { 
            font-size: 28px; 
            font-weight: bold; 
            margin: 0; 
        }
        .section { margin-bottom: 30px; }
        .section h2 { 
            font-size: 20px; 
            font-weight: bold; 
            border-bottom: 1px solid #e9ecef; 
            padding-bottom: 8px; 
            margin-bottom: 15px; 
        }
        .grid { 
            display: grid; 
            grid-template-columns: 180px 1fr; 
            gap: 10px 20px; 
        }
        .grid .label { font-weight: bold; }
        .recommendation { font-weight: bold; }
        .recommendation.critical { color: #dc3545; }
        .recommendation.normal { color: #198754; }
        .archive-title { 
            text-align: center; 
            margin-bottom: 40px; 
            border-bottom: 2px solid #ccc; 
            padding-bottom: 20px; 
        }
        .notes { 
            background-color: #e9ecef; 
            padding: 15px; 
            border-radius: 4px; 
            border-left: 4px solid #0d6efd; 
        }
        .findings-list { 
            list-style: none; 
            padding-left: 0; 
        }
        .finding-item { 
            background-color: #f8f9fa; 
            border: 1px solid #dee2e6; 
            border-radius: 4px; 
            padding: 10px; 
            margin-bottom: 10px; 
        }
        .finding-item .label { 
            font-weight: bold; 
            color: #0d6efd; 
        }
        .ai-content {
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 20px;
            margin-top: 15px;
        }
        .ai-content h4 {
            color: #0d6efd;
            margin-top: 20px;
            margin-bottom: 10px;
            font-size: 16px;
        }
        .ai-content h4:first-child {
            margin-top: 0;
        }
        .disclaimer {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 15px;
            margin-top: 20px;
            color: #856404;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="archive-title">
            <h1>Clinical History Report</h1>
            <p style="font-size: 1.5rem; margin-top: 8px;">Patient: ${patientName}</p>
        </div>
        
        <div class="report-header">
            <h1>Medical Assessment Report</h1>
        </div>
        
        <section class="section">
            <h2>Patient Details</h2>
            <div class="grid">
                <span class="label">Patient Name:</span><span>${formData.patientName || 'N/A'}</span>
                <span class="label">Age:</span><span>${formData.patientAge || 'N/A'}</span>
                <span class="label">Gender:</span><span>${formData.gender || 'N/A'}</span>
                <span class="label">Report Date:</span><span>${reportDate}</span>
            </div>
        </section>

        <section class="section">
            <h2>Chief Complaint</h2>
            <p><strong>Primary Concern:</strong> ${formData.chiefComplaint || 'Not specified'}</p>
        </section>

        ${formData.site || formData.onset || formData.character ? `
        <section class="section">
            <h2>Presenting Complaint Details (SOCRATES)</h2>
            <div class="grid">
                ${formData.site ? `<span class="label">Site:</span><span>${formData.site}</span>` : ''}
                ${formData.onset ? `<span class="label">Onset:</span><span>${formData.onset}</span>` : ''}
                ${formData.character ? `<span class="label">Character:</span><span>${formData.character}</span>` : ''}
                ${formData.radiation ? `<span class="label">Radiation:</span><span>${formData.radiation}</span>` : ''}
                ${formData.associatedSymptoms ? `<span class="label">Associated Symptoms:</span><span>${formData.associatedSymptoms}</span>` : ''}
                ${formData.timing ? `<span class="label">Timing:</span><span>${formData.timing}</span>` : ''}
                ${formData.exacerbating ? `<span class="label">Exacerbating Factors:</span><span>${formData.exacerbating}</span>` : ''}
                ${formData.relieving ? `<span class="label">Relieving Factors:</span><span>${formData.relieving}</span>` : ''}
                ${formData.severity ? `<span class="label">Severity:</span><span>${formData.severity}</span>` : ''}
            </div>
        </section>
        ` : ''}

        ${formData.smoking || formData.alcohol || formData.occupation ? `
        <section class="section">
            <h2>Social History</h2>
            <div class="grid">
                ${formData.smoking ? `<span class="label">Smoking Status:</span><span>${formData.smoking}</span>` : ''}
                ${formData.alcohol ? `<span class="label">Alcohol:</span><span>${formData.alcohol}</span>` : ''}
                ${formData.occupation ? `<span class="label">Occupation:</span><span>${formData.occupation}</span>` : ''}
                ${formData.living ? `<span class="label">Living Situation:</span><span>${formData.living}</span>` : ''}
                ${formData.travel ? `<span class="label">Recent Travel:</span><span>${formData.travel}</span>` : ''}
            </div>
        </section>
        ` : ''}

        ${aiContent ? `
        <section class="section">
            <h2>AI Clinical Assessment</h2>
            <div class="ai-content">
                ${formatAIContent(aiContent)}
            </div>
            <div class="disclaimer">
                <strong>Educational Use Only:</strong> This AI-generated assessment is for educational purposes only. Always consult qualified medical professionals for actual patient care and clinical decisions.
            </div>
        </section>
        ` : ''}
    </div>
</body>
</html>`;

  return htmlContent;
}

function formatAIContent(content) {
  if (!content) return '';
  
  // Enhanced formatting for medical content
  let formattedContent = content
    // Convert markdown-style headers to HTML
    .replace(/^## (.*$)/gm, '<h4>$1</h4>')
    .replace(/^\*\*(.*?)\*\*/gm, '<strong>$1</strong>')
    // Format numbered lists
    .replace(/^\d+\.\s+\*\*(.*?)\*\*/gm, '<strong>$1</strong>')
    // Format bullet points
    .replace(/^- (.*$)/gm, '• $1')
    // Convert double line breaks to paragraphs
    .replace(/\n\n/g, '</p><p>')
    // Convert single line breaks to <br>
    .replace(/\n/g, '<br>');

  return `<p>${formattedContent}</p>`;
}

export function downloadHTMLReport(htmlContent, patientName) {
  try {
    const fileName = `Clinical_Report_${patientName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
    
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    console.log('[HTML Report] Report downloaded successfully:', fileName);
    return true;
  } catch (error) {
    console.error('[HTML Report] Download failed:', error);
    return false;
  }
}

export function openHTMLReportInNewTab(htmlContent) {
  try {
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(htmlContent);
      newWindow.document.close();
      console.log('[HTML Report] Report opened in new tab');
      return true;
    } else {
      console.error('[HTML Report] Failed to open new window - popup blocked?');
      return false;
    }
  } catch (error) {
    console.error('[HTML Report] Failed to open in new tab:', error);
    return false;
  }
}
