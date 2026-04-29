import React, { useState, useEffect, useMemo } from "react";
import "./BusPassCard.css";

function BusPassCard({ data }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update the clock every second for security (prevents static screenshots)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Color of the Day Logic (Changes based on day of the week)
  const dayColors = [
    '#d32f2f', // Sun (Red)
    '#1976d2', // Mon (Blue)
    '#388e3c', // Tue (Green)
    '#fbc02d', // Wed (Yellow/Gold)
    '#7b1fa2', // Thu (Purple)
    '#e64a19', // Fri (Orange)
    '#0097a7'  // Sat (Teal)
  ];
  const headerColor = dayColors[currentTime.getDay()];

  const renewalId = useMemo(
    () => data?.pass_number || data?.passNumber || data?.renewal_id || data?.renewalId || ("BP" + Date.now().toString(36).toUpperCase()),
    [data]
  );
  const ticketNumber = useMemo(
    () => data?.ticket_number || data?.ticketNumber || ("TK" + Math.floor(10000000 + Math.random() * 90000000)),
    [data]
  );

  const issueDate = data?.issueDate
    ? new Date(data.issueDate)
    : data?.issue_date
      ? new Date(data.issue_date)
      : new Date();
  const months = data?.planMonths || data?.plan_months || 1;
  const expiryDate = data?.expiryDate
    ? new Date(data.expiryDate)
    : data?.expiry_date
      ? new Date(data.expiry_date)
      : (() => {
          const d = new Date(issueDate);
          d.setMonth(issueDate.getMonth() + months);
          return d;
        })();

  const formatDate = (date) =>
    date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  // Calculate age from date of birth
  const calculateAge = (dob) => {
    if (!dob) return "N/A";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(data?.date_of_birth);

  const issueDateStr = formatDate(issueDate);

  if (!data) return <div className="pass-container">No Data Available</div>;

  const isExpired = expiryDate < new Date();

  return (
    <div className={`pass-container ${isExpired ? 'expired-pass' : ''}`}>
      {isExpired && (
        <div className="expired-stamp">
          EXPIRED
        </div>
      )}

      {/* ── Floating Date Watermark ── */}
      <div className="floating-date-watermark">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="floating-date-text">
            {issueDateStr} &nbsp;&nbsp; {renewalId}
          </span>
        ))}
      </div>

      {/* ── Header with Shimmer & Day Color ── */}
      <div className="pass-header" style={{ backgroundColor: headerColor }}>
        <div className="shimmer-overlay"></div>
        <h3>APPTD (APSRTC)</h3>
        <span>Student Route Pass</span>
      </div>

      {/* ── Live Clock (Security Feature) ── */}
      <div className="live-clock">
        {currentTime.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} &nbsp;|&nbsp; {currentTime.toLocaleTimeString([], { hour12: true })}
      </div>

      {/* ── Photo + Basic Info Row ── */}
      <div className="pass-top-row">
        <div className="pass-photo-box">
          {(data.photo || data.application_photo) ? (
            <img src={data.photo || data.application_photo} alt="Pass Holder" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div className="pass-photo-placeholder">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="#8B4513"/>
                <path d="M12 14C7.58172 14 4 16.6863 4 20V22H20V20C20 16.6863 16.4183 14 12 14Z" fill="#8B4513"/>
              </svg>
            </div>
          )}
        </div>
        <div className="pass-top-info">
          <p><strong>NAME:</strong> <span>{data.holder_name || data.studentName || data.name || data.full_name}</span></p>
          <p><strong>INSTITUTION:</strong> <span>{data.institution_name || data.schoolCollegeName || data.institutionName || "N/A"}</span></p>
          <p><strong>PASS NO:</strong> <span>{renewalId}</span></p>
          <p><strong>TICKET NO:</strong> <span>{ticketNumber}</span></p>
        </div>
      </div>

      {/* ── Personal Details ── */}
      <div className="pass-body">
        <p><strong>DATE OF BIRTH:</strong> <span>{data.date_of_birth ? formatDate(new Date(data.date_of_birth)) : "N/A"}</span></p>
        <p><strong>AGE / GENDER:</strong> <span>{age}Y / {data.gender || "N/A"}</span></p>
      </div>

      {/* ── Route & Payment Details ── */}
      <div className="pass-body">
        <p className="route-highlight"><strong>ROUTE:</strong> <span>{data.from_place || data.from} → {data.to_place || data.to}</span></p>
        <p><strong>AMOUNT PAID:</strong> <span>₹{data.amount || data.amountPaid || '0'}</span></p>
      </div>

      {/* ── Validity Banner ── */}
      <div className="pass-validity-banner">
        Valid: {formatDate(issueDate)} &nbsp;→&nbsp; {formatDate(expiryDate)}
      </div>

      <button onClick={() => window.print()} className="print-btn">
        🖨 Print Pass
      </button>
    </div>
  );
}

export default BusPassCard;
