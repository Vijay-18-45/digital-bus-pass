import { useEffect, useRef } from 'react';
import './TeluguVoiceHelper.css';

// ──────────────────────────────────────────────────────────
//  Voice cache — resolved once voices are loaded
// ──────────────────────────────────────────────────────────
let cachedTeluguVoice = null;
let voicesReady = false;

const loadVoices = () => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return false;

    // Try to find a Telugu voice
    cachedTeluguVoice =
        voices.find(v => v.lang === 'te-IN') ||
        voices.find(v => v.lang.startsWith('te')) ||
        voices.find(v => v.name.toLowerCase().includes('telugu')) ||
        null;

    voicesReady = true;
    console.log(
        cachedTeluguVoice
            ? `🔊 Telugu voice found: ${cachedTeluguVoice.name}`
            : '⚠️ No Telugu voice found — using Hindi/default fallback'
    );

    // If no Telugu voice, try Hindi as fallback for similar script readability
    if (!cachedTeluguVoice) {
        cachedTeluguVoice =
            voices.find(v => v.lang === 'hi-IN') ||
            voices.find(v => v.lang.startsWith('hi')) ||
            null;
    }
    return true;
};

// ──────────────────────────────────────────────────────────
//  Comprehensive English → Telugu label mapping
// ──────────────────────────────────────────────────────────
const TELUGU_MAP = {
    // ── Common Fields ──
    'Full Name': 'పూర్తి పేరు',
    'Full Name of Employee': 'ఉద్యోగి పూర్తి పేరు',
    'Full Name of Applicant': 'దరఖాస్తుదారు పూర్తి పేరు',
    'Date of Birth': 'పుట్టిన తేదీ',
    'Gender': 'లింగం',
    'Father/Guardian Name': 'తండ్రి / సంరక్షకుడి పేరు',
    'Guardian Name': 'సంరక్షకుడి పేరు',

    // ── Student Fields ──
    'Student Category': 'విద్యార్థి వర్గం',
    'Is Government Employee Child': 'ప్రభుత్వ ఉద్యోగి బిడ్డనా?',
    'Parent/Guardian Employee Name': 'తల్లిదండ్రి / సంరక్షకుడి ఉద్యోగి పేరు',
    'PF Number': 'పి.ఎఫ్ నంబర్',
    'Physically Challenged / Differently Abled': 'శారీరక వికలాంగులు / భిన్న సామర్థ్యులు',
    'Disability Certificate': 'వికలాంగ ధృవీకరణ పత్రం',

    // ── Institution Fields ──
    'Institution Type': 'సంస్థ రకం',
    'Institution Name': 'సంస్థ / పాఠశాల / కళాశాల పేరు',
    'Education Level / Class / Course': 'విద్యా స్థాయి / తరగతి / కోర్సు',
    'Class / Course': 'తరగతి / కోర్సు',
    'Academic Year': 'విద్యా సంవత్సరం',
    'Registration / Roll / Hall Ticket Number': 'రిజిస్ట్రేషన్ / రోల్ / హాల్ టికెట్ నంబర్',
    'SSC Board Type': 'ఎస్.ఎస్.సి బోర్డ్ రకం',
    'SSC Year of Pass': 'ఎస్.ఎస్.సి ఉత్తీర్ణ సంవత్సరం',
    'SSC Hall Ticket Number': 'ఎస్.ఎస్.సి హాల్ టికెట్ నంబర్',

    // ── Address Fields ──
    'Residential Address / Door No / Street': 'నివాస చిరునామా / ఇంటి నంబర్ / వీధి',
    'Door No / Street': 'ఇంటి నంబర్ / వీధి',
    'House Address': 'ఇంటి చిరునామా',
    'Office Address': 'కార్యాలయ చిరునామా',
    'Village / Town / City': 'గ్రామం / పట్టణం / నగరం',
    'Village / Town': 'గ్రామం / పట్టణం',
    'City / Town': 'నగరం / పట్టణం',
    'District': 'జిల్లా',
    'Pincode': 'పిన్ కోడ్',
    'PIN Code': 'పిన్ కోడ్',
    'Mandal / District': 'మండలం / జిల్లా',

    // ── Route / Pass Fields ──
    'Boarding Point / Stage': 'ఎక్కే స్థలం / స్టేజ్',
    'Boarding Point': 'ఎక్కే స్థలం',
    'Destination / Institution Location': 'గమ్యం / సంస్థ ప్రదేశం',
    'Destination (Office Location)': 'గమ్యం (కార్యాలయ ప్రదేశం)',
    'Destination (NGO Work Location)': 'గమ్యం (ఎన్.జి.ఓ పని ప్రదేశం)',
    'Destination': 'గమ్యం',
    'Nearest Bus Depot': 'సమీపంలోని బస్ డిపో',
    'Route Selection / Via': 'మార్గం ఎంపిక / వయా',
    'Route Selection': 'మార్గం ఎంపిక',
    'Pass Type': 'పాస్ రకం',
    'Pass Duration': 'పాస్ వ్యవధి',
    'From Place': 'ఎక్కడి నుండి',
    'To Place': 'ఎక్కడికి',
    'Validity': 'చెల్లుబాటు',
    'Depot': 'డిపో',

    // ── Contact Fields ──
    'Registered Mobile Number': 'రిజిస్టర్డ్ మొబైల్ నంబర్',
    'Mobile Number': 'మొబైల్ నంబర్',
    'Email Address (Optional)': 'ఇమెయిల్ చిరునామా (ఐచ్ఛికం)',
    'Email Address': 'ఇమెయిల్ చిరునామా',
    'Email ID (Optional)': 'ఇమెయిల్ ఐడి (ఐచ్ఛికం)',

    // ── Identity / Upload Fields ──
    'Aadhaar Number': 'ఆధార్ నంబర్',
    'Aadhar Number': 'ఆధార్ నంబర్',
    'Institution ID Card / Bonafide Certificate': 'సంస్థ గుర్తింపు కార్డు / బోనాఫైడ్ సర్టిఫికేట్',
    'Address Proof (e.g. Aadhaar/Voter ID)': 'చిరునామా రుజువు (ఉదా. ఆధార్ / ఓటర్ ఐడి)',
    'Address Proof (Optional)': 'చిరునామా రుజువు (ఐచ్ఛికం)',
    'Address Proof Type': 'చిరునామా రుజువు రకం',
    'Upload Address Proof': 'చిరునామా రుజువు అప్‌లోడ్ చేయండి',
    'Upload Aadhaar Proof': 'ఆధార్ రుజువు అప్‌లోడ్ చేయండి',
    'Study Certificate (if applicable)': 'అధ్యయన ధృవీకరణ (వర్తించినట్లయితే)',
    'Recent Passport Size Photo': 'ఇటీవలి పాస్‌పోర్ట్ సైజ్ ఫోటో',
    'Applicant Photo': 'దరఖాస్తుదారు ఫోటో',
    'Upload Document': 'డాక్యుమెంట్ అప్‌లోడ్ చేయండి',
    'Upload Proof Image': 'రుజువు చిత్రం అప్‌లోడ్ చేయండి',

    // ── Gov Employee Fields ──
    'Employee Type': 'ఉద్యోగి రకం',
    'Organization / Department Name': 'సంస్థ / విభాగం పేరు',
    'Office / Organization Name': 'కార్యాలయం / సంస్థ పేరు',
    'Organization Name': 'సంస్థ పేరు',
    'Designation': 'హోదా',
    'Employee ID Number': 'ఉద్యోగి గుర్తింపు నంబర్',
    'PF / GPF / EPF ID (Optional)': 'పి.ఎఫ్ / జి.పి.ఎఫ్ / ఇ.పి.ఎఫ్ ఐడి (ఐచ్ఛికం)',

    // ── Non-Gov Employee Fields ──
    'Occupation Type': 'వృత్తి రకం',
    'Workplace / Purpose of Travel': 'పని ప్రదేశం / ప్రయాణ ఉద్దేశ్యం',

    // ── Journalist Fields ──
    'Accreditation Number': 'అక్రెడిటేషన్ నంబర్',
    'Employment Type': 'ఉద్యోగ రకం',
    'Date of Joining': 'చేరిన తేదీ',
    'Press / Journalist ID Card': 'ప్రెస్ / జర్నలిస్ట్ గుర్తింపు కార్డు',
    'Accreditation Certificate': 'అక్రెడిటేషన్ ధృవీకరణ పత్రం',
    'Authorization Letter': 'అధికార పత్రం',

    // ── NGO Fields ──
    'NGO Name': 'ఎన్.జి.ఓ పేరు',
    'NGO Registration Number': 'ఎన్.జి.ఓ రిజిస్ట్రేషన్ నంబర్',
    'NGO Type / Category': 'ఎన్.జి.ఓ రకం / వర్గం',
    'NGO Office Address': 'ఎన్.జి.ఓ కార్యాలయ చిరునామా',
    'Applicant Designation in NGO': 'ఎన్.జి.ఓ లో దరఖాస్తుదారు హోదా',
    'Employee / Volunteer ID (if available)': 'ఉద్యోగి / వాలంటీర్ ఐడి (అందుబాటులో ఉంటే)',
    'Date of Joining NGO': 'ఎన్.జి.ఓ లో చేరిన తేదీ',
    'Work Location': 'పని ప్రదేశం',
    'NGO ID Card': 'ఎన్.జి.ఓ గుర్తింపు కార్డు',
    'NGO Authorization Letter / Employment Certificate': 'ఎన్.జి.ఓ అధికార పత్రం / ఉద్యోగ ధృవీకరణ',
    'NGO Registration Certificate (organization proof)': 'ఎన్.జి.ఓ రిజిస్ట్రేషన్ ధృవీకరణ (సంస్థ రుజువు)',
};

// ──────────────────────────────────────────────────────────
//  Speech synthesis helper
// ──────────────────────────────────────────────────────────
const speak = (text, btn) => {
    if (!window.speechSynthesis) {
        console.warn('Speech synthesis not supported');
        return;
    }

    // Chrome bug: calling getVoices() is sometimes needed to "prime" the engine
    if (!voicesReady) loadVoices();

    window.speechSynthesis.cancel();

    // Chrome sometimes stays in a paused state after cancel — fix it
    if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'te-IN';
    utterance.rate = 0.85;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Assign the best available voice
    if (cachedTeluguVoice) {
        utterance.voice = cachedTeluguVoice;
        utterance.lang = cachedTeluguVoice.lang;
    }

    if (btn) {
        btn.classList.add('speaking');
        utterance.onend = () => btn.classList.remove('speaking');
        utterance.onerror = (e) => {
            console.warn('Speech error:', e.error);
            btn.classList.remove('speaking');
        };
    }

    // Chrome has a known bug where long utterances get cut off.
    // A workaround is to keep the synthesis alive with a periodic resume.
    let keepAlive;
    utterance.onstart = () => {
        keepAlive = setInterval(() => {
            if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
                window.speechSynthesis.pause();
                window.speechSynthesis.resume();
            }
        }, 5000);
    };
    const originalOnEnd = utterance.onend;
    utterance.onend = (e) => {
        clearInterval(keepAlive);
        if (originalOnEnd) originalOnEnd(e);
    };
    const originalOnError = utterance.onerror;
    utterance.onerror = (e) => {
        clearInterval(keepAlive);
        if (originalOnError) originalOnError(e);
    };

    window.speechSynthesis.speak(utterance);
};

// ──────────────────────────────────────────────────────────
//  Find Telugu text for a given label
// ──────────────────────────────────────────────────────────
const findTelugu = (rawText) => {
    // Clean label text: remove *, 🔊, extra spaces
    const cleaned = rawText.replace(/[*🔊]/g, '').replace(/\s+/g, ' ').trim();

    // If already Telugu script, speak as-is
    if (/[\u0C00-\u0C7F]/.test(cleaned)) return cleaned;

    // Exact match
    if (TELUGU_MAP[cleaned]) return TELUGU_MAP[cleaned];

    // Try without trailing "(Optional)" etc
    const withoutParens = cleaned.replace(/\s*\(.*?\)\s*$/, '').trim();
    if (TELUGU_MAP[withoutParens]) return TELUGU_MAP[withoutParens];

    // Partial / fuzzy match (longest match wins)
    const lower = cleaned.toLowerCase();
    let bestMatch = null;
    let bestLen = 0;
    for (const [eng, tel] of Object.entries(TELUGU_MAP)) {
        const engLower = eng.toLowerCase();
        if (lower.includes(engLower) && engLower.length > bestLen) {
            bestMatch = tel;
            bestLen = engLower.length;
        }
    }
    return bestMatch;
};

// ──────────────────────────────────────────────────────────
//  Inject speaker icons into unprocessed <label> elements
// ──────────────────────────────────────────────────────────
const processLabels = () => {
    const labels = document.querySelectorAll('label:not([data-telugu-voice])');

    labels.forEach(label => {
        // Skip long text labels (declarations / checkboxes)
        if (label.textContent.length > 100) return;
        // Skip labels that are inside admin/login forms
        if (label.closest('.admin-login, .gov-login-form, .email-otp-container')) return;

        const text = label.textContent;
        const telugu = findTelugu(text);
        if (!telugu) return;

        label.setAttribute('data-telugu-voice', 'true');

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'telugu-voice-btn';
        btn.setAttribute('aria-label', `Listen in Telugu: ${telugu}`);
        btn.setAttribute('title', telugu);
        btn.textContent = '🔊';

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            speak(telugu, btn);
        });

        label.appendChild(btn);
    });
};

// ──────────────────────────────────────────────────────────
//  React Component (renders nothing, observes DOM)
// ──────────────────────────────────────────────────────────
const TeluguVoiceHelper = () => {
    const timerRef = useRef(null);

    useEffect(() => {
        // ── Load voices (Chrome loads them async) ──
        if (window.speechSynthesis) {
            // Try immediately (Firefox / Safari often have them ready)
            loadVoices();

            // Chrome fires this event when voices are loaded
            window.speechSynthesis.onvoiceschanged = () => {
                loadVoices();
                // Re-process labels after voices are ready in case buttons were skipped
                processLabels();
            };
        }

        const debouncedProcess = () => {
            clearTimeout(timerRef.current);
            timerRef.current = setTimeout(processLabels, 300);
        };

        // Initial run
        debouncedProcess();

        // Watch for new labels (route changes, dynamic renders)
        const observer = new MutationObserver(debouncedProcess);
        observer.observe(document.body, { childList: true, subtree: true });

        return () => {
            observer.disconnect();
            clearTimeout(timerRef.current);
            window.speechSynthesis.cancel();
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, []);

    return null;
};

export default TeluguVoiceHelper;
