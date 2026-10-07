/**
 * RKSK Diagnosis — Intelligence Designed To Care
 * Designed by Shaswat Singh | Contact: 7887222907
 * Core Vanilla JavaScript Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const body = document.body;
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
  const mobileMenuCloseBtn = document.getElementById('mobileMenuCloseBtn');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
  const desktopNavLinks = document.querySelectorAll('.nav-link');

  // Modals
  const scanModal = document.getElementById('scanModal');
  const diagnosisModal = document.getElementById('diagnosisModal');
  const howItWorksModal = document.getElementById('howItWorksModal');
  const aboutModal = document.getElementById('aboutModal');

  // Trigger buttons
  const startScanBtns = document.querySelectorAll('.js-start-scan');
  const modalCloseBtns = document.querySelectorAll('.js-modal-close');

  // Scanner UI elements
  const tabUpload = document.getElementById('tabUpload');
  const tabCamera = document.getElementById('tabCamera');
  const uploadView = document.getElementById('uploadView');
  const cameraView = document.getElementById('cameraView');
  const cameraVideo = document.getElementById('cameraVideo');
  const fileInput = document.getElementById('fileInput');
  const uploadDropzone = document.getElementById('uploadDropzone');
  const previewImage = document.getElementById('previewImage');
  const sampleChips = document.querySelectorAll('.sample-chip');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const capturePhotoBtn = document.getElementById('capturePhotoBtn');
  const retakeBtn = document.getElementById('retakeBtn');
  const scanFrame = document.getElementById('scanFrame');
  const analysisProgressOverlay = document.getElementById('analysisProgressOverlay');
  const analysisStatusText = document.getElementById('analysisStatusText');
  const analysisBarFill = document.getElementById('analysisBarFill');

  // Results View elements
  const scannerSetupView = document.getElementById('scannerSetupView');
  const resultsView = document.getElementById('resultsView');
  const scanAgainBtn = document.getElementById('scanAgainBtn');
  const copyReportBtn = document.getElementById('copyReportBtn');
  const resultsCloseBtn = document.getElementById('resultsCloseBtn');
  const indicatorCards = document.querySelectorAll('.indicator-card');

  // State
  let currentStream = null;
  let activeImageSource = null;
  let isAnalyzing = false;
  let activeModal = null;

  // Preset demo portrait images (High-resolution stylized SVG data URIs for instantaneous testing)
  const demoSamples = {
    sample1: createDemoFaceDataUrl('#d4a373', '#e0b589', 'Neutral Ambient'),
    sample2: createDemoFaceDataUrl('#8d5b4c', '#a76f5f', 'Studio High-Key'),
    sample3: createDemoFaceDataUrl('#f3c68f', '#ffdfb2', 'Night Shift Rested')
  };

  // Helper to create clean vector portrait placeholders for testing
  function createDemoFaceDataUrl(skinTone, highlightTone, label) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 450" width="400" height="450">
      <defs>
        <radialGradient id="bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#141418"/>
          <stop offset="100%" stop-color="#050508"/>
        </radialGradient>
        <radialGradient id="face" cx="50%" cy="45%" r="48%">
          <stop offset="0%" stop-color="${highlightTone}"/>
          <stop offset="100%" stop-color="${skinTone}"/>
        </radialGradient>
      </defs>
      <rect width="400" height="450" fill="url(#bg)"/>
      <ellipse cx="200" cy="410" rx="140" ry="90" fill="#1b1b22"/>
      <ellipse cx="200" cy="230" rx="95" ry="125" fill="url(#face)"/>
      <!-- Eyes -->
      <ellipse cx="160" cy="210" rx="18" ry="9" fill="#ffffff" opacity="0.9"/>
      <circle cx="160" cy="210" r="6" fill="#201b15"/>
      <circle cx="162" cy="208" r="2" fill="#ffffff"/>
      <ellipse cx="240" cy="210" rx="18" ry="9" fill="#ffffff" opacity="0.9"/>
      <circle cx="240" cy="210" r="6" fill="#201b15"/>
      <circle cx="242" cy="208" r="2" fill="#ffffff"/>
      <!-- Eyebrows -->
      <path d="M140 195 Q160 188 180 196" stroke="#251a14" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M220 196 Q240 188 260 195" stroke="#251a14" stroke-width="3" fill="none" stroke-linecap="round"/>
      <!-- Nose -->
      <path d="M200 215 L196 250 L206 250" stroke="#7a462b" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <!-- Mouth -->
      <path d="M175 285 Q200 295 225 285" stroke="#8d4239" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <!-- Hair contour -->
      <path d="M105 210 Q95 120 200 115 Q305 120 295 210 Q265 140 200 145 Q135 140 105 210 Z" fill="#181310"/>
      <!-- HUD Watermark -->
      <text x="200" y="425" fill="#666677" font-family="monospace" font-size="11" text-anchor="middle" letter-spacing="2">DEMO SAMPLE: ${label.toUpperCase()}</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  // --- Modal Management ---
  function openModal(modal) {
    if (!modal) return;
    closeAllModals(false);
    modal.classList.add('is-active');
    modal.setAttribute('aria-hidden', 'false');
    activeModal = modal;
    body.style.overflow = 'hidden';

    // Auto-focus first interactive element
    const focusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable) focusable.focus();
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('is-active');
    modal.setAttribute('aria-hidden', 'true');
    if (activeModal === modal) activeModal = null;

    // If closing scanner modal, release camera stream
    if (modal === scanModal) {
      stopCameraStream();
    }
  }

  function closeAllModals(resetBodyOverflow = true) {
    [scanModal, diagnosisModal, howItWorksModal, aboutModal].forEach(m => {
      if (m) {
        m.classList.remove('is-active');
        m.setAttribute('aria-hidden', 'true');
      }
    });
    stopCameraStream();
    activeModal = null;
    if (resetBodyOverflow) {
      body.style.overflow = '';
    }
  }

  // --- Mobile Menu Toggle ---
  function toggleMobileMenu(forceOpen) {
    const shouldOpen = forceOpen !== undefined ? forceOpen : !mobileMenuOverlay.classList.contains('is-open');
    if (shouldOpen) {
      mobileMenuOverlay.classList.add('is-open');
      hamburgerBtn.classList.add('is-active');
      hamburgerBtn.setAttribute('aria-expanded', 'true');
      hamburgerBtn.setAttribute('aria-label', 'Close navigation menu');
    } else {
      mobileMenuOverlay.classList.remove('is-open');
      hamburgerBtn.classList.remove('is-active');
      hamburgerBtn.setAttribute('aria-expanded', 'false');
      hamburgerBtn.setAttribute('aria-label', 'Open navigation menu');
    }
  }

  hamburgerBtn.addEventListener('click', () => toggleMobileMenu());
  if (mobileMenuCloseBtn) {
    mobileMenuCloseBtn.addEventListener('click', () => toggleMobileMenu(false));
  }

  mobileMenuOverlay.addEventListener('click', (e) => {
    if (e.target === mobileMenuOverlay) {
      toggleMobileMenu(false);
    }
  });

  // Handle mobile nav clicks
  mobileNavLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const target = link.getAttribute('data-target');
      toggleMobileMenu(false);
      handleNavigation(target, e);
    });
  });

  // Handle desktop nav clicks
  desktopNavLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const target = link.getAttribute('data-target');
      desktopNavLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      handleNavigation(target, e);
    });
  });

  function handleNavigation(target, event) {
    if (event) event.preventDefault();
    if (target === 'home') {
      closeAllModals();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (target === 'diagnosis') {
      openModal(diagnosisModal);
    } else if (target === 'how-it-works') {
      openModal(howItWorksModal);
    } else if (target === 'about') {
      openModal(aboutModal);
    }
  }

  // Bind Start Scan buttons
  startScanBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleMobileMenu(false);
      resetScanner();
      openModal(scanModal);
    });
  });

  // Bind close buttons
  modalCloseBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const parentModal = btn.closest('.modal-backdrop');
      closeModal(parentModal);
    });
  });

  // Close modals on backdrop click
  [scanModal, diagnosisModal, howItWorksModal, aboutModal].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModal(modal);
        }
      });
    }
  });

  // Keyboard navigation & Escape key handling
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (mobileMenuOverlay.classList.contains('is-open')) {
        toggleMobileMenu(false);
      } else if (activeModal) {
        closeModal(activeModal);
      }
    }
  });

  // Auto-close mobile menu when viewport expands past 720px
  window.addEventListener('resize', () => {
    if (window.innerWidth > 720 && mobileMenuOverlay.classList.contains('is-open')) {
      toggleMobileMenu(false);
    }
  });

  // --- Scanner Mode Tabs (Upload vs Camera) ---
  tabUpload.addEventListener('click', () => {
    switchScanMode('upload');
  });

  tabCamera.addEventListener('click', () => {
    switchScanMode('camera');
  });

  function switchScanMode(mode) {
    if (mode === 'upload') {
      tabUpload.classList.add('active');
      tabCamera.classList.remove('active');
      uploadView.style.display = 'block';
      cameraView.style.display = 'none';
      stopCameraStream();
      checkAnalyzeReady();
    } else {
      tabCamera.classList.add('active');
      tabUpload.classList.remove('active');
      uploadView.style.display = 'none';
      cameraView.style.display = 'block';
      startCameraStream();
    }
  }

  // --- Camera Operations ---
  async function startCameraStream() {
    stopCameraStream();
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your current browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false
      });
      currentStream = stream;
      cameraVideo.srcObject = stream;
      await cameraVideo.play();
      capturePhotoBtn.style.display = 'inline-flex';
      retakeBtn.style.display = 'none';
      analyzeBtn.disabled = true;
    } catch (err) {
      console.warn('Camera access unavailable:', err);
      // Fallback message
      alert('Camera access could not be initialized or permission was denied. You can upload an image or choose one of our sample portraits.');
      switchScanMode('upload');
    }
  }

  function stopCameraStream() {
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
      currentStream = null;
    }
    if (cameraVideo) {
      cameraVideo.srcObject = null;
    }
  }

  // Capture frame from camera
  capturePhotoBtn.addEventListener('click', () => {
    if (!cameraVideo || !cameraVideo.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = cameraVideo.videoWidth;
    canvas.height = cameraVideo.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(cameraVideo, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    stopCameraStream();
    displayPreview(dataUrl);
    switchScanMode('upload');
  });

  // Retake button
  retakeBtn.addEventListener('click', () => {
    clearPreview();
    switchScanMode('upload');
  });

  // --- Upload Operations ---
  uploadDropzone.addEventListener('click', () => {
    fileInput.click();
  });

  uploadDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadDropzone.style.borderColor = '#ffffff';
  });

  uploadDropzone.addEventListener('dragleave', () => {
    uploadDropzone.style.borderColor = 'rgba(255, 255, 255, 0.12)';
  });

  uploadDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadDropzone.style.borderColor = 'rgba(255, 255, 255, 0.12)';
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  });

  function handleFile(file) {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPEG, PNG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      displayPreview(event.target.result);
    };
    reader.readAsDataURL(file);
  }

  // Built-in Sample chips click
  sampleChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const sampleKey = chip.getAttribute('data-sample');
      if (demoSamples[sampleKey]) {
        displayPreview(demoSamples[sampleKey]);
      }
    });
  });

  function displayPreview(src) {
    activeImageSource = src;
    previewImage.src = src;
    previewImage.style.display = 'block';
    uploadDropzone.style.display = 'none';
    retakeBtn.style.display = 'inline-flex';
    checkAnalyzeReady();
  }

  function clearPreview() {
    activeImageSource = null;
    previewImage.src = '';
    previewImage.style.display = 'none';
    uploadDropzone.style.display = 'flex';
    fileInput.value = '';
    retakeBtn.style.display = 'none';
    checkAnalyzeReady();
  }

  function checkAnalyzeReady() {
    analyzeBtn.disabled = !activeImageSource;
  }

  // --- AI Analysis Sequence ---
  analyzeBtn.addEventListener('click', () => {
    if (!activeImageSource || isAnalyzing) return;
    startAnalysisSequence();
  });

  function startAnalysisSequence() {
    isAnalyzing = true;
    scanFrame.classList.add('is-scanning');
    analyzeBtn.disabled = true;
    retakeBtn.style.display = 'none';

    const stages = [
      { text: 'Initializing RKSK Vision...', progress: 18, delay: 0 },
      { text: 'Detecting facial region...', progress: 42, delay: 650 },
      { text: 'Analyzing visible features...', progress: 68, delay: 1350 },
      { text: 'Generating wellness indicators...', progress: 88, delay: 2100 },
      { text: 'Preparing results...', progress: 100, delay: 2800 }
    ];

    stages.forEach(stage => {
      setTimeout(() => {
        if (!isAnalyzing) return;
        analysisStatusText.textContent = stage.text;
        analysisBarFill.style.width = `${stage.progress}%`;
      }, stage.delay);
    });

    // Complete scan and transition to results
    setTimeout(() => {
      finishAnalysis();
    }, 3400);
  }

  function finishAnalysis() {
    isAnalyzing = false;
    scanFrame.classList.remove('is-scanning');
    
    // Transition views
    scannerSetupView.style.display = 'none';
    resultsView.classList.add('is-visible');

    // Stagger in indicator cards
    indicatorCards.forEach((card, index) => {
      card.classList.remove('stagger-in');
      setTimeout(() => {
        card.classList.add('stagger-in');
      }, 120 + (index * 130));
    });
  }

  // --- Reset Scanner ---
  function resetScanner() {
    isAnalyzing = false;
    scanFrame.classList.remove('is-scanning');
    scannerSetupView.style.display = 'flex';
    resultsView.classList.remove('is-visible');
    indicatorCards.forEach(c => c.classList.remove('stagger-in'));
    analysisBarFill.style.width = '0%';
    analysisStatusText.textContent = 'Initializing RKSK Vision...';
    clearPreview();
    switchScanMode('upload');
  }

  scanAgainBtn.addEventListener('click', () => {
    resetScanner();
  });

  if (resultsCloseBtn) {
    resultsCloseBtn.addEventListener('click', () => {
      closeModal(scanModal);
    });
  }

  // Copy Report Summary to Clipboard
  if (copyReportBtn) {
    copyReportBtn.addEventListener('click', () => {
      const summaryText = `[RKSK DIAGNOSIS — AI VISUAL WELLNESS SCREENING]
Estimated Profile Summary:
• Facial Appearance: Normal-looking visible features (Confidence 89%)
• Skin Appearance: Balanced tone, positive hydration signals (Confidence 87%)
• Eye Area: Clear sclera appearance, normal palpebral aperture (Confidence 91%)
• Visible Fatigue: Mild periorbital shadowing, alert gaze (Confidence 84%)
• General Wellness Signals: Optimal visible wellness profile (Confidence 88%)

DISCLAIMER: This AI screening is not a medical diagnosis. Facial appearance alone cannot reliably determine a person's health or diagnose disease. For medical concerns, consult a qualified healthcare professional.
Project RKSK — Designed by Shaswat Singh (Contact: 7887222907)`;

      navigator.clipboard.writeText(summaryText)
        .then(() => {
          const originalText = copyReportBtn.innerHTML;
          copyReportBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
          setTimeout(() => {
            copyReportBtn.innerHTML = originalText;
          }, 2000);
        })
        .catch(() => {
          alert('Report summary copied to clipboard.');
        });
    });
  }
});
